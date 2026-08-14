import { AppError } from "../../errors/app.errors";

import { OnboardingRepository, onboardingRepository } from "./onboarding.repository";
import { CompleteOnBoardingInput } from "./onboarding.types";

export class OnboardingService{
    constructor(private readonly onboardingReposity:OnboardingRepository){}

    async completeOnboarding(
        userId: string,
        input: CompleteOnBoardingInput
    ){
        const exisitingUsername = await this.onboardingReposity.findUsername(input.username);

        if(exisitingUsername && exisitingUsername.userId !== userId){
            throw new AppError("Username is already Taken",400);
        }

        const programmingLanguage = await this.onboardingReposity.findProgrammingLanguage(input.preferredLanguageId);

        if(!programmingLanguage){
            throw new AppError("Programming Language not Found.",400);
        }

        return this.onboardingReposity.completeOnboarding(userId,input);
    }
}

export const onboardingService = new OnboardingService(onboardingRepository);