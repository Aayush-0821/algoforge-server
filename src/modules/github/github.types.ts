export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  owner: {
    login: string;
  };
}

export interface GitHubContentFile {
  type: "file" | "dir";
  encoding?: string;
  size?: number;
  name: string;
  path: string;
  content?: string;
  sha?: string;
  url: string;
  html_url?: string;
  git_url?: string;
  download_url?: string | null;
}

export interface GitHubCreateRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

export interface GitHubFileResponse {
  content: {
    name: string;
    path: string;
    sha: string;
    html_url: string;
  };

  commit: {
    sha: string;
    html_url: string;
    message: string;
  };
}

export interface RevisionComplexity {
  time: string;
  space: string;
}

export interface StructuredRevision {
  approach: string;
  keyIdea: string;
  algorithm: string[];
  complexity: RevisionComplexity;
  commonMistakes: string[];
  interviewNotes: string[];
  whatToRemember: string;
}