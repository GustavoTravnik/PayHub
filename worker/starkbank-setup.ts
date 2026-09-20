import * as starkbank from 'starkbank';

export const environment = process.env.STARK_BANK_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
export const projectId = process.env.STARK_BANK_PROJECT_ID || '';
export const privateKey = (process.env.STARK_BANK_PRIVATE_KEY || '').replace(/\\n/g, '\n');

export const initializeStarkBank = () => {
  if (projectId && privateKey && privateKey.includes('BEGIN')) {
    starkbank.setUser(new starkbank.Project({
      environment,
      id: projectId,
      privateKey,
    }));
  }
};
