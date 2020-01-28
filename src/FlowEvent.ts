import Cloudevent, { event } from 'cloudevents-sdk/v1';

import { ElementMetadata } from './FlowElement';

export class FlowEvent {
  private event: Cloudevent;

  constructor(metadata: ElementMetadata, data: any, outputId = 'default', time = new Date(), dataType = 'application/json') {
    const { id: elementId, flowId, deploymentId } = metadata;
    this.event = event()
      .source(`flows/${flowId}/deployment/${deploymentId}`)
      .subject(elementId)
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
  public getSource = (): string => this.event.getSource();
  public getSubject = (): string => this.event.getSubject();
  public getTime = (): Date => this.event.getTime();
  public getType = (): string => this.event.getType();
  public toString = (): string => this.event.toString();
}
