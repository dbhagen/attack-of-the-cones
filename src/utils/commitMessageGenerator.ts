// Generates random conventional commit messages for cone labels

const COMMIT_TYPES = ['feat', 'fix', 'chore', 'refactor', 'perf', 'test', 'docs', 'style'];

const TECHNICAL_ACTIONS = [
  'updated',
  'refactored',
  'optimized',
  'implemented',
  'fixed',
  'enhanced',
  'migrated',
  'integrated',
  'deprecated',
  'removed',
  'added',
  'improved',
];

const TECHNICAL_SUBJECTS = [
  'API endpoint',
  'database schema',
  'caching layer',
  'authentication flow',
  'error handling',
  'logging system',
  'webhook handler',
  'rate limiter',
  'data validation',
  'test coverage',
  'CI/CD pipeline',
  'Docker config',
  'GraphQL resolver',
  'Redis cache',
  'message queue',
  'background job',
  'middleware chain',
  'session management',
  'file upload',
  'pagination logic',
  'search indexing',
  'notification service',
  'payment gateway',
  'email templates',
  'user permissions',
  'encryption module',
  'backup script',
  'monitoring alerts',
];

const TECHNICAL_DETAILS = [
  'for better performance',
  'to fix memory leak',
  'with new architecture',
  'following best practices',
  'per security requirements',
  'for scalability',
  'to reduce latency',
  'with proper error handling',
  'for production readiness',
  'to improve reliability',
  'with enhanced logging',
  'for better UX',
  'to handle edge cases',
  'with validation checks',
  'for mobile support',
  'to fix race condition',
  'with retry logic',
  'for backwards compatibility',
  'to optimize queries',
  'with connection pooling',
  'for high availability',
];

export function generateCommitMessage(): string {
  const type = COMMIT_TYPES[Math.floor(Math.random() * COMMIT_TYPES.length)];
  const storyId = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  const action = TECHNICAL_ACTIONS[Math.floor(Math.random() * TECHNICAL_ACTIONS.length)];
  const subject = TECHNICAL_SUBJECTS[Math.floor(Math.random() * TECHNICAL_SUBJECTS.length)];
  const detail = TECHNICAL_DETAILS[Math.floor(Math.random() * TECHNICAL_DETAILS.length)];

  return `${type}: STORY-${storyId} ${action} ${subject} ${detail}`;
}
