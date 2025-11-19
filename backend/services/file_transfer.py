"""
File Transfer Service
Handles JSON report transfer via SSH/FTP
"""
import json
import paramiko
from pathlib import Path
from loguru import logger
from typing import Dict, Any
from backend.config import settings


class FileTransferService:
    """
    Service to transfer JSON reports to remote systems
    """

    def __init__(self):
        self.ssh_enabled = settings.SSH_ENABLED
        self.ftp_enabled = settings.FTP_ENABLED

    def send_json_report(self, study_uid: str, report_data: Dict[str, Any]):
        """
        Send JSON report to remote system
        """
        try:
            # Generate JSON filename
            filename = f"{study_uid}_report.json"

            # Convert report to JSON string
            json_content = json.dumps(report_data, indent=2, ensure_ascii=False)

            # Send via SSH
            if self.ssh_enabled:
                self._send_via_ssh(filename, json_content)

            # Send via FTP
            if self.ftp_enabled:
                self._send_via_ftp(filename, json_content)

            logger.info(f"JSON report sent: {filename}")

        except Exception as e:
            logger.error(f"Error sending JSON report: {e}")
            raise

    def _send_via_ssh(self, filename: str, content: str):
        """
        Send file via SSH/SFTP
        """
        try:
            logger.info(f"Sending file via SSH: {filename}")

            # Create SSH client
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # Connect to remote server
            if settings.SSH_KEY_PATH:
                # Use key-based authentication
                ssh.connect(
                    hostname=settings.SSH_HOST,
                    port=settings.SSH_PORT,
                    username=settings.SSH_USER,
                    key_filename=settings.SSH_KEY_PATH,
                    timeout=30
                )
            else:
                # Use password authentication (not recommended for production)
                logger.warning("SSH password authentication not configured")
                return

            # Open SFTP session
            sftp = ssh.open_sftp()

            # Remote file path
            remote_path = f"{settings.FTP_REMOTE_PATH}/{filename}"

            # Write content to remote file
            with sftp.file(remote_path, 'w') as f:
                f.write(content)

            logger.info(f"File sent via SSH: {remote_path}")

            # Close connections
            sftp.close()
            ssh.close()

        except Exception as e:
            logger.error(f"Error sending file via SSH: {e}")
            raise

    def _send_via_ftp(self, filename: str, content: str):
        """
        Send file via FTP
        """
        try:
            logger.info(f"Sending file via FTP: {filename}")

            # Create SSH client (SFTP is part of SSH)
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # Connect to remote server
            ssh.connect(
                hostname=settings.FTP_HOST,
                port=settings.FTP_PORT,
                username=settings.FTP_USER,
                password=settings.FTP_PASSWORD,
                timeout=30
            )

            # Open SFTP session
            sftp = ssh.open_sftp()

            # Remote file path
            remote_path = f"{settings.FTP_REMOTE_PATH}/{filename}"

            # Write content to remote file
            with sftp.file(remote_path, 'w') as f:
                f.write(content)

            logger.info(f"File sent via FTP: {remote_path}")

            # Close connections
            sftp.close()
            ssh.close()

        except Exception as e:
            logger.error(f"Error sending file via FTP: {e}")
            raise

    def test_connection(self) -> Dict[str, bool]:
        """
        Test SSH/FTP connections
        """
        results = {
            'ssh': False,
            'ftp': False
        }

        # Test SSH connection
        if self.ssh_enabled:
            try:
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

                if settings.SSH_KEY_PATH:
                    ssh.connect(
                        hostname=settings.SSH_HOST,
                        port=settings.SSH_PORT,
                        username=settings.SSH_USER,
                        key_filename=settings.SSH_KEY_PATH,
                        timeout=10
                    )
                    results['ssh'] = True
                    ssh.close()
                    logger.info("SSH connection test successful")

            except Exception as e:
                logger.error(f"SSH connection test failed: {e}")

        # Test FTP connection
        if self.ftp_enabled:
            try:
                ssh = paramiko.SSHClient()
                ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

                ssh.connect(
                    hostname=settings.FTP_HOST,
                    port=settings.FTP_PORT,
                    username=settings.FTP_USER,
                    password=settings.FTP_PASSWORD,
                    timeout=10
                )
                results['ftp'] = True
                ssh.close()
                logger.info("FTP connection test successful")

            except Exception as e:
                logger.error(f"FTP connection test failed: {e}")

        return results
