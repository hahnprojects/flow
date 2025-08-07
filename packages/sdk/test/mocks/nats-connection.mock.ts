/**
 * Mock implementation of a NATS connection for testing purposes.
 *
 * @details
 * - only mocks the publish and subscribe methods.
 *    - supports basic subject matching
 *    - supports wildcard subscriptions with > are supported (e.g., 'foo.>')
 *    - single wildcard subscriptions with * are not supported (e.g., 'foo.*')
 */
export class NatsConnectionMock {
  private stopAllSubscriptions = false;

  /**
   * Sends a request to a subject and waits for a response.
   * Returns a response based on messages available in the queues.
   *
   * @param subject - The subject to send the request to.
   * @param payload - The request payload (optional).
   * @param options - Request options (optional).
   * @returns A promise that resolves to a mock message response or rejects if no message is available.
   */
  public async request(subject: string, payload?: any, options?: any): Promise<any> {
    if (subject.startsWith('$JS.API.')) {
      return Promise.resolve({
        data: new TextEncoder().encode('{}'),
        json: () => JSON.parse('{}'),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
    const message = this.getMessageFromQueue(subject);
    if (message) {
      return Promise.resolve({
        data: message,
        subject: subject,
        reply: undefined,
        headers: undefined,
        json: () => JSON.parse(message),
      });
    } else {
      return Promise.reject(new Error(`No message available for subject: ${subject}`));
    }
  }

  /**
   * Stores message queues for each subject.
   * @private
   */
  private queues: { [subject: string]: any[] } = {};

  /**
   * Publishes a message to a specific subject.
   * If the subject does not exist, it initializes a new queue for it.
   *
   * @param subject - The subject to publish the message to.
   * @param payload - The message payload to publish (optional).
   */
  public publish(subject: string, payload?: any) {
    if (!this.queues[subject]) {
      this.queues[subject] = [];
    }
    this.queues[subject].push(JSON.stringify(payload));
  }

  /**
   * Closes the connection
   */
  public async close(): Promise<void> {
    this.stopAllSubscriptions = true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  public async drain(): Promise<void> {
    await this.close();
  }

  /**
   * Checks if the connection is closed.
   * @returns `false` as the mock connection is always open.
   */
  public isClosed() {
    return this.stopAllSubscriptions;
  }

  private getMessageFromQueue(subject: string, queues = this.queues) {
    if (!queues[subject]) {
      queues[subject] = [];
    }
    if (subject.endsWith('.>')) {
      for (const key in queues) {
        if (key.startsWith(subject.slice(0, -1)) && queues[key].length > 0) {
          return queues[key].shift();
        }
      }
    } else if (queues[subject].length > 0) {
      return queues[subject].shift();
    }
    return undefined;
  }

  /**
   * Subscribes to a specific subject and returns an async iterator for messages.
   * Supports wildcard subjects ending with `.>` to subscribe to multiple subjects.
   *
   * @param subject - The subject to subscribe to.
   * @param queues - The message queues to use (default is the internal queues).
   * @param getter
   * @param stopAllSubscriptions
   * @returns An object containing the `unsubscribe` method and an async iterator for messages.
   */
  public subscribe(
    subject: string,
    queues = this.queues,
    getter = this.getMessageFromQueue,
    stopAllSubscriptions = this.stopAllSubscriptions,
  ) {
    let activeSub = true;
    return {
      unsubscribe: () => {
        activeSub = false;
      },
      async *[Symbol.asyncIterator]() {
        while (activeSub && !stopAllSubscriptions) {
          const nextMsg = getter(subject, queues);
          if (nextMsg) {
            yield {
              json: () => JSON.parse(nextMsg),
            };
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        return;
      },
    };
  }
}
