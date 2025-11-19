# MedGemma Chest X-Ray Automation System

An automated DICOM chest X-ray analysis system powered by Google's MedGemma 27B AI model. This system automatically receives DICOM images, performs AI analysis, generates structured reports (DICOM SR), and exports results in multiple formats.

## Features

- **DICOM Integration**
  - DICOM SCP server for receiving chest X-ray images
  - Automatic DICOM SR (Structured Report) generation
  - Configurable DICOM nodes (source and destination)
  - Support for multiple AE titles

- **AI Analysis**
  - Powered by MedGemma 27B model
  - Automatic classification: Normal, Abnormal, Critical, Emergency
  - Detailed findings and impression generation
  - Customizable prompt templates

- **Age and Study Filtering**
  - Configurable minimum age (default: 20+ years)
  - Study description filtering (chest PA, AP, lateral)
  - DICOM tag-based filtering

- **Web Management Interface**
  - Dashboard with real-time statistics
  - DICOM Settings: Configure nodes and connections
  - Processing List: Monitor incoming studies
  - Result List: View analysis results with expandable details
  - Prompt Settings: Manage AI model prompts

- **Report Export**
  - DICOM SR format
  - JSON format for RIS integration
  - SSH/FTP transfer support
  - Automatic delivery to configured destinations

- **Enterprise Features**
  - RabbitMQ message queue for reliable processing
  - PostgreSQL database for data persistence
  - Redis caching
  - Docker-based deployment
  - Horizontal scaling support

## System Architecture

```
┌─────────────┐
│ PACS/Modality│
└──────┬──────┘
       │ DICOM
       ▼
┌─────────────────┐
│  DICOM SCP      │
│  (Port 11112)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│   RabbitMQ      │◄────►│  PostgreSQL  │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  AI Worker      │
│  (MedGemma 27B) │
└────────┬────────┘
         │
         ├─────► DICOM SR
         │
         └─────► JSON Export (SSH/FTP)
```

## Requirements

### Hardware Requirements

- **CPU**: 8+ cores recommended
- **RAM**: 32GB+ recommended (for MedGemma 27B model)
- **GPU**: NVIDIA GPU with 16GB+ VRAM (for optimal performance)
  - CUDA 12.1+ support
  - Compute Capability 7.0+
- **Storage**: 100GB+ for model and data storage

### Software Requirements

- Docker 24.0+
- Docker Compose 2.20+
- NVIDIA Container Toolkit (for GPU support)
- Linux OS (Ubuntu 22.04+ recommended)

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd medgemma_chest
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

Key configuration variables:

```ini
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/medgemma_chest

# DICOM Settings
DICOM_AE_TITLE=MEDGEMMA_SCP
DICOM_PORT=11112

# Model Settings
MODEL_NAME=google/medgemma-27b-it
MODEL_LOAD_IN_8BIT=true

# Security
SECRET_KEY=your-secret-key-change-this

# Age Filter
MIN_AGE=20

# Allowed Study Descriptions
ALLOWED_STUDY_DESCRIPTIONS=chest pa,chest ap,chest lateral,cxr
```

### 3. Start System

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start all services
./scripts/start.sh
```

This will:
1. Create necessary data directories
2. Pull and build Docker images
3. Initialize the database
4. Start all services

### 4. Access Interfaces

- **Web UI**: http://localhost:3000
- **API Documentation**: http://localhost:8000/api/docs
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **DICOM SCP**: Port 11112

## Usage

### 1. Configure DICOM Nodes

Navigate to **DICOM Settings** in the web interface:

1. **Add Source Nodes** (systems that send images to this system)
   - AE Title: e.g., `PACS_SERVER`
   - IP Address: e.g., `192.168.1.100`
   - Port: e.g., `104`
   - Type: `source`

2. **Add Destination Nodes** (systems to send reports to)
   - AE Title: e.g., `RIS_SERVER`
   - IP Address: e.g., `192.168.1.200`
   - Port: e.g., `104`
   - Type: `destination`

### 2. Configure PACS/Modality

Configure your PACS or modality to send chest X-ray studies to:

- **AE Title**: `MEDGEMMA_SCP`
- **IP Address**: `<server-ip>`
- **Port**: `11112`

### 3. Customize Prompts

Navigate to **Prompt Settings**:

1. View/edit existing prompts
2. Create custom prompts for specific use cases
3. Set default prompts for analysis
4. Configure output structure

### 4. Monitor Processing

Navigate to **Processing List**:

- View incoming studies
- Monitor processing status
- Check for errors
- Retry failed studies

### 5. Review Results

Navigate to **Result List**:

- Filter by classification (Normal, Abnormal, Critical, Emergency)
- Expand studies to view detailed findings and impressions
- Export reports
- Review confidence scores

## Configuration

### DICOM Study Filtering

The system filters incoming studies based on:

1. **Patient Age**: Only processes patients >= configured minimum age
2. **Study Description**: Matches against allowed descriptions
   - Default: chest pa, chest ap, chest lateral, cxr
   - Case-insensitive matching

Configure in `.env`:

```ini
MIN_AGE=20
ALLOWED_STUDY_DESCRIPTIONS=chest pa,chest ap,chest lateral,cxr
```

### Report Export Configuration

#### SSH Export

```ini
SSH_ENABLED=true
SSH_HOST=ris.example.com
SSH_PORT=22
SSH_USER=medgemma
SSH_KEY_PATH=/path/to/private/key
```

#### FTP Export

```ini
FTP_ENABLED=true
FTP_HOST=ftp.example.com
FTP_PORT=22
FTP_USER=medgemma
FTP_PASSWORD=secure-password
FTP_REMOTE_PATH=/reports
```

### Classification Thresholds

Adjust confidence thresholds for classification:

```ini
THRESHOLD_NORMAL=0.8
THRESHOLD_ABNORMAL=0.6
THRESHOLD_CRITICAL=0.4
THRESHOLD_EMERGENCY=0.2
```

## Scaling

### Horizontal Scaling

Scale processing workers:

```bash
docker-compose up -d --scale worker_dicom=4
```

### GPU Allocation

Configure GPU allocation in `docker-compose.yml`:

```yaml
worker_dicom:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1  # Number of GPUs
            capabilities: [gpu]
```

## Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker_dicom
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres medgemma_chest > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres medgemma_chest < backup.sql
```

### Update System

```bash
# Pull latest code
git pull

# Rebuild images
docker-compose build

# Restart services
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Model Download Issues

The MedGemma 27B model (~54GB) will be downloaded on first run. If download fails:

```bash
# Pre-download model
docker-compose run --rm backend python -c "
from transformers import AutoTokenizer, AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained('google/medgemma-27b-it', cache_dir='/app/models')
"
```

### DICOM Connection Issues

1. Check firewall allows port 11112
2. Verify AE title configuration matches
3. Test with DICOM tools:

```bash
# Echo test
echoscu <server-ip> 11112 -aec MEDGEMMA_SCP

# Store test
storescu <server-ip> 11112 -aec MEDGEMMA_SCP test.dcm
```

### GPU Issues

```bash
# Check GPU availability
docker-compose exec worker_dicom nvidia-smi

# Check CUDA in container
docker-compose exec worker_dicom python -c "import torch; print(torch.cuda.is_available())"
```

### Memory Issues

If system runs out of memory:

1. Enable 8-bit quantization: `MODEL_LOAD_IN_8BIT=true`
2. Reduce worker count
3. Add swap space
4. Upgrade RAM

## API Documentation

Interactive API documentation available at:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

### Key Endpoints

- `GET /api/v1/studies` - List studies
- `GET /api/v1/studies/stats` - Get statistics
- `GET /api/v1/studies/{uid}` - Get study details
- `GET /api/v1/dicom-nodes` - List DICOM nodes
- `POST /api/v1/dicom-nodes` - Create DICOM node
- `GET /api/v1/prompts` - List prompt templates
- `POST /api/v1/prompts` - Create prompt template

## Security Considerations

1. **Change default passwords** in `.env`
2. **Use HTTPS** in production (configure nginx with SSL)
3. **Restrict network access** to DICOM port
4. **Regular backups** of database
5. **Update dependencies** regularly
6. **Monitor logs** for suspicious activity

## License

[Specify your license]

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [documentation-url]

## Acknowledgments

- Google MedGemma Team for the AI model
- DICOM standard contributors
- Open source community
