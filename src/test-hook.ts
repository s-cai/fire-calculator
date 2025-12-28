// Test file to verify pre-commit hook works
import { NonExistentType } from './nowhere'; // This will cause an error

export function test(): void {
  console.log('test');
}

