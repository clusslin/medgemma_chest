"""
RabbitMQ Message Queue Service
Handles message publishing and consumption
"""
import pika
import json
from loguru import logger
from typing import Callable
from backend.config import settings


class MessageQueueService:
    """
    RabbitMQ Service for message queue operations
    """

    def __init__(self):
        self.connection = None
        self.channel = None
        self._connect()

    def _connect(self):
        """
        Connect to RabbitMQ server
        """
        try:
            credentials = pika.PlainCredentials(
                settings.RABBITMQ_USER,
                settings.RABBITMQ_PASSWORD
            )
            parameters = pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                virtual_host=settings.RABBITMQ_VHOST,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300,
            )
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()

            # Declare queues
            self.channel.queue_declare(
                queue=settings.RABBITMQ_QUEUE_DICOM,
                durable=True
            )
            self.channel.queue_declare(
                queue=settings.RABBITMQ_QUEUE_REPORT,
                durable=True
            )

            logger.info("Connected to RabbitMQ")

        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise

    def publish_dicom_received(self, study_uid: str):
        """
        Publish message when DICOM is received
        """
        try:
            message = {
                "study_uid": study_uid,
                "event": "dicom_received"
            }

            self.channel.basic_publish(
                exchange='',
                routing_key=settings.RABBITMQ_QUEUE_DICOM,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                )
            )

            logger.info(f"Published DICOM received message: {study_uid}")

        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            # Reconnect and retry
            self._connect()
            self.publish_dicom_received(study_uid)

    def publish_report_generated(self, study_uid: str, report_data: dict):
        """
        Publish message when report is generated
        """
        try:
            message = {
                "study_uid": study_uid,
                "event": "report_generated",
                "report_data": report_data
            }

            self.channel.basic_publish(
                exchange='',
                routing_key=settings.RABBITMQ_QUEUE_REPORT,
                body=json.dumps(message),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                )
            )

            logger.info(f"Published report generated message: {study_uid}")

        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            # Reconnect and retry
            self._connect()
            self.publish_report_generated(study_uid, report_data)

    def consume_dicom_queue(self, callback: Callable):
        """
        Consume messages from DICOM queue
        """
        def on_message(ch, method, properties, body):
            try:
                message = json.loads(body)
                logger.info(f"Received message: {message}")

                # Call the callback function
                callback(message)

                # Acknowledge the message
                ch.basic_ack(delivery_tag=method.delivery_tag)

            except Exception as e:
                logger.error(f"Error processing message: {e}")
                # Reject and requeue the message
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=settings.RABBITMQ_QUEUE_DICOM,
            on_message_callback=on_message
        )

        logger.info("Starting to consume DICOM queue")
        self.channel.start_consuming()

    def consume_report_queue(self, callback: Callable):
        """
        Consume messages from report queue
        """
        def on_message(ch, method, properties, body):
            try:
                message = json.loads(body)
                logger.info(f"Received report message: {message}")

                # Call the callback function
                callback(message)

                # Acknowledge the message
                ch.basic_ack(delivery_tag=method.delivery_tag)

            except Exception as e:
                logger.error(f"Error processing report message: {e}")
                # Reject and requeue the message
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)

        self.channel.basic_qos(prefetch_count=1)
        self.channel.basic_consume(
            queue=settings.RABBITMQ_QUEUE_REPORT,
            on_message_callback=on_message
        )

        logger.info("Starting to consume report queue")
        self.channel.start_consuming()

    def close(self):
        """
        Close connection to RabbitMQ
        """
        if self.connection:
            self.connection.close()
            logger.info("Closed RabbitMQ connection")
