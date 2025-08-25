import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Legacy method for backward compatibility
  multiply(a: number, b: number): number;
  
  // Hermes Sandbox methods
  createRuntime(name?: string): Promise<number>;
  evaluateInRuntime(runtimeId: number, code: string, sourceURL?: string): Promise<string>;
  evaluate(code: string): Promise<string>;
  deleteRuntime(runtimeId: number): Promise<boolean>;
  hasRuntime(runtimeId: number): Promise<boolean>;
  getRuntimeName(runtimeId: number): Promise<string | null>;
  getRuntimeCount(): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('HermesSandboxCore');
