/**
 * Helper para testar exceções em controllers
 */
export async function expectToThrow(
  fn: () => Promise<any>,
  expectedError?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw an error, but it did not');
  } catch (error: any) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        if (!error.message?.includes(expectedError)) {
          throw new Error(
            `Expected error message to include "${expectedError}", but got: ${error.message}`
          );
        }
      } else {
        if (!expectedError.test(error.message || '')) {
          throw new Error(
            `Expected error message to match ${expectedError}, but got: ${error.message}`
          );
        }
      }
    }
  }
}

