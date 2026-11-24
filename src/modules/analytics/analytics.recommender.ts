import fs from "fs";

import { type DifficultyLevel } from "../../../generated/postgres";

import {
    DIFFICULTY_ORDER,
    PROBLEM_MODEL_PATH,
    REGENCY_DECAY,
    RECOMMENDATION_REASON,
    STATUS_WEIGHT,
    STRUGGLE_STATUSES,
    TAG_BONUS
} from "./analytics.constants";

import type {
    HistoryEntry,
    ProblemModel,
    RawProblemModel,
    RecommendOption,
    ScoredCandidate,
} from "./analytics.types";

export class ProblemRecommender {
    private model: ProblemModel | null = null;
    private slugIndex = new Map<string, number>();

    warmup(): void{
        this.load();
    }

    private load(): ProblemModel {
        if(this.model) return this.model;

        const raw = JSON.parse(fs.readFileSync(PROBLEM_MODEL_PATH, "utf-8")) as RawProblemModel;

        this.model = {
            ...raw,
            difficulty: raw.difficulty.map((d) => d.toUpperCase() as DifficultyLevel),
        };

        this.slugIndex = new Map(raw.slugs.map((slug,i) => [slug,i]));

        return this.model;
    }

    recommend(history: HistoryEntry[], options: RecommendOption): ScoredCandidate[] {
        const model = this.load();

        const scores = new Map<number, number>();

        const bestContributor = new Map<number, {amount: number; struggled: boolean}>();

        const tagWeight = new Map<string, number>();

        let usableEntries = 0;

        history.forEach((entry,rank)=>{
            const i = this.slugIndex.get(entry.slug);

            if(i === undefined) return;

            usableEntries++;

            const weight = REGENCY_DECAY ** rank * STATUS_WEIGHT[entry.status];

            const struggled = STRUGGLE_STATUSES.has(entry.status);

            for(const [j, similarity] of model.neighbors[i]){
                const amount = weight * similarity;

                scores.set(j, (scores.get(j) ?? 0) + amount);

                const best = bestContributor.get(j);

                if(!best || amount > best.amount) bestContributor.set(j,{amount,struggled});
            }

            for(const tag of model.tags[i]){
                tagWeight.set(tag, (tagWeight.get(tag) ?? 0) + weight);
            }
        });

        if(usableEntries === 0) return [];

        const totalTagWeight = [...tagWeight.values()].reduce((a,b)=>a+b,0) || 1;

        const candidates: ScoredCandidate[] = [];

        for(const [j,baseScore] of scores){
            const slug = model.slugs[j];

            if(options.excludeSlugs.has(slug)) continue;
            if(DIFFICULTY_ORDER[model.difficulty[j]] > options.maxDifficulty) continue;

            const overlap = model.tags[j].reduce((sum,tag) => sum + (tagWeight.get(tag) ?? 0), 0);

            candidates.push({
                slug,
                score: baseScore + (TAG_BONUS * overlap) / totalTagWeight,
                reasonCode: bestContributor.get(j)?.struggled ? RECOMMENDATION_REASON.PRACTICE_WEAK_PATTERN : RECOMMENDATION_REASON.NEXT_STEP,
            });
        }

        return candidates.sort((a,b) => b.score - a.score).slice(0,options.limit);
    }
}

export const problemRecommender = new ProblemRecommender();