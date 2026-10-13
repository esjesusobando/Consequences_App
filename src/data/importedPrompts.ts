export interface ImportedPrompt {
  id: string;
  title: string;
  category: string;
  prompt: string;
  tags: string[];
  folder: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  sotaLevel?: 'basic' | 'intermediate' | 'advanced' | 'sota';
}

export const IMPORTED_PROMPTS: ImportedPrompt[] = [
  {
    id: 'seed-prompt-1',
    title: 'Architectural Blueprint Review',
    category: 'Dev',
    prompt: 'Act as a Principal Software Architect. Review the system design specification focusing on scalability, single points of failure, latency boundaries, and modular boundaries. Provide actionable mitigation steps.',
    tags: ['Architecture', 'Review', 'SOTA'],
    folder: 'Engineering',
    isFavorite: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sotaLevel: 'sota'
  },
  {
    id: 'seed-prompt-2',
    title: 'High-Conversion Landing Page Copy',
    category: 'Marketing',
    prompt: 'Craft a high-converting value proposition and hero headline following the Pain-Agitate-Solution (PAS) framework for tech founders and designers.',
    tags: ['Copywriting', 'Conversion'],
    folder: 'Growth',
    isFavorite: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sotaLevel: 'advanced'
  }
];
