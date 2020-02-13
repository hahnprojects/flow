import Cloudevent, { event } from 'cloudevents-sdk/v1';

import { ElementMetadata } from './FlowElement';

export class FlowEvent {
  private event: Cloudevent;
  private metadata;

  constructor(metadata: ElementMetadata, data: any, outputId = 'default', time = new Date(), dataType?: string) {
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
    this.event = event()
      .source(`flows/${flowId}/deployments/${deploymentId}/elements/${elementId}`)
      .subject(functionFqn)
      .type(outputId)
      .dataContentType(dataType)
      .data(data)
      .time(time);
  }

  public format = (): any => this.event.format();
  public getData = (): any => this.event.getData() || {};
  public getDataContentType = (): string => this.event.getDataContentType();
  public getDataschema = (): string => this.event.getDataschema();
  public getId = (): string => this.event.getId();
  public getMetadata = () => this.metadata;
  public getSource = (): string => this.event.getSource();
  public getStreamId = (): string => `${this.metadata.elementId}.${this.event.getType()}`;
  public getSubject = (): string => this.event.getSubject();
  public getTime = (): Date => this.event.getTime();
  public getType = (): string => this.event.getType();
  public toString = (): string => this.event.toString();
}
