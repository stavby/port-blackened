import { Injectable } from "@nestjs/common";
import { Kafka, Producer } from "kafkajs";
import { ClassificationStateEvent, CreateEvent, DeleteEvent, DomainOwnersEvent, SpecialTagEvent } from "@port/common-schemas";

export enum KafkaProducerTopics {
  Lens = "lens",
}

@Injectable()
export class KafkaService {
  private readonly kafka: Kafka;
  private readonly kafkaProducer: Producer;
  private readonly kafkaProducerTopicNames: Record<KafkaProducerTopics, string>;
  private producerDisconnectTimeout: NodeJS.Timeout | null;

  constructor() {
    // this.kafka = new Kafka({ clientId: process.env.KAFKA_CLIENT, brokers: process.env.KAFKA_BROKERS.split(",") });
    // this.kafkaProducer = this.kafka.producer();
    // this.kafkaProducerTopicNames = {
    //   [KafkaProducerTopics.Lens]: process.env.KAFKA_PRODUCER_LENS_TOPIC || "",
    // };
    // this.producerDisconnectTimeout = null;
  }

  async sendMessage(
    key: string,
    data: ClassificationStateEvent | DomainOwnersEvent | SpecialTagEvent | DeleteEvent | CreateEvent,
    topic: KafkaProducerTopics = KafkaProducerTopics.Lens,
  ) {
    // BLACKEND
    console.log(`KafkaService.sendMessage: key=${key}, topic=${topic}, data=`, data);
    // if (this.producerDisconnectTimeout) {
    //   clearTimeout(this.producerDisconnectTimeout);
    // }
    // this.producerDisconnectTimeout = setTimeout(async () => {
    //   await this.kafkaProducer.disconnect();
    //   this.producerDisconnectTimeout = null;
    // }, 60000);

    // await this.kafkaProducer.connect();
    // await this.kafkaProducer.send({
    //   topic: this.kafkaProducerTopicNames[topic],
    //   messages: [{ key, value: JSON.stringify(data) }],
    // });
  }
}
