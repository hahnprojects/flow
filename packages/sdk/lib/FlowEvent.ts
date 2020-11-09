import { CloudEvent } from 'cloudevents';

import { FlowElementContext } from './flow.interface';

export class FlowEvent {
  private event: CloudEvent;
  private metadata;

  constructor(metadata: FlowElementContext, data: any, outputId = 'default', time = new Date(), dataType?: string) {
    const { id: elementId, deploymentId, flowId, functionFqn } = metadata;
    if (data instanceof Error) {
      const error = { message: data.message, stack: data.stack };
      data = error;
    }
    if (dataType == null) {
      if (typeof data === 'string') {
        try {
          JSON.parse(data);
          dataType = 'application/json';
        } catch (err) {
          dataType = 'text/plain';
        }
      } else if (typeof data === 'object' && data != null) {
        dataType = 'application/json';
      } else {
        data = String(data);
        dataType = 'text/plain';
      }
    }

    this.metadata = { deploymentId, elementId, flowId, functionFqn };
    this.event = new CloudEvent({
      source: `flows/${flowId}/deployments/${deploymentId}/elements/${elementId}`,
      type: outputId,
      subject: functionFqn,
      datacontenttype: dataType,
      data,
      time,
    });
  }

  public format = (): any => this.event.toJSON();
  public getData = (): any => this.event.data || {};
  public getDataContentType = (): string => this.event.datacontenttype;
  public getDataschema = (): string => this.event.dataschema;
  public getId = (): string => this.event.id;
  public getMetadata = () => this.metadata;
  public getSource = (): string => this.event.source;
  public getStreamId = (): string => `${this.metadata.elementId}.${this.event.type}`;
  public getSubject = (): string => this.event.subject;
  public getTime = (): Date => new Date(this.event.time);
  public getType = (): string => this.event.type;
  public toJSON = (): any => this.event.toJSON();
  public toString = (): string => this.event.toString();
}
