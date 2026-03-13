---
name: sce-document-osint
description: 'Document metadata extraction and analysis including author information, creation details, hidden data, and file properties. Use when investigating documents for forensics, OSINT, or security research. Returns document metadata analysis report.'
compatibility:
- claude-code
- codex
- amp
- opencode
metadata:
  version: 1.0.0
  author: SDLC Security Team
  tags:
  - osint
  - metadata
  - document-analysis
  - forensics
  - exif
  tools: Bash Read Grep
  category: Security & Intelligence
---

# Document OSINT Skill

Extracts and analyzes metadata from documents and files.

## When to Use This Skill

- Document forensics and investigation
- Metadata extraction for OSINT
- Author and origin identification
- Hidden data discovery
- File property analysis
- Image EXIF data extraction
- PDF metadata review
- Office document analysis

## Unitary Function

**ONE RESPONSIBILITY:** Extract and analyze document metadata and hidden data

**NOT RESPONSIBLE FOR:**
- Threat intelligence (see sce-threat-intel-osint)
- Social media analysis (see sce-social-media-osint)
- People background checks (see sce-people-osint)
- Document content analysis (focuses on metadata only)
- Malware analysis (see sce-threat-intel-osint)

## Input

- **file_path**: Path to document or file
- **file_type**: Optional (auto-detected if not provided)
- **extract_all**: Optional boolean to extract all possible metadata
- **include_exif**: Optional boolean for image EXIF data

## Output

Document metadata report (JSON format):

```json
{
  "investigation_id": "OSINT-DOCUMENT-uuid",
  "timestamp": "ISO-8601",
  "file_name": "document.pdf",
  "file_type": "PDF",
  "risk_score": "Low|Medium|High|Critical",
  "findings": {
    "basic_properties": {
      "file_size": "2.5 MB",
      "created": "2024-06-15T10:30:00Z",
      "modified": "2024-12-01T14:22:00Z",
      "accessed": "2025-01-10T09:15:00Z",
      "md5": "abc123...",
      "sha256": "def456..."
    },
    "document_metadata": {
      "author": "John Doe",
      "creator": "Microsoft Word 2019",
      "producer": "Adobe PDF Library 15.0",
      "creation_date": "2024-06-15T10:30:00Z",
      "modification_date": "2024-12-01T14:22:00Z",
      "title": "Confidential Report",
      "subject": "Q4 Analysis",
      "keywords": ["financial", "quarterly", "report"]
    },
    "software_fingerprint": {
      "creating_application": "Microsoft Word 2019",
      "operating_system": "Windows 10",
      "software_version": "16.0.12345",
      "template": "Normal.dotm"
    },
    "hidden_data": {
      "tracked_changes": true,
      "comments": 5,
      "hidden_text": false,
      "custom_properties": {
        "Company": "Example Corporation",
        "Department": "Finance"
      }
    },
    "revision_history": {
      "revision_count": 12,
      "total_editing_time": "4 hours 35 minutes",
      "previous_authors": ["Jane Smith", "Bob Johnson"]
    },
    "embedded_data": {
      "images": 3,
      "links": 5,
      "embedded_files": []
    }
  },
  "recommendations": []
}
```

## Document Types Supported

### Office Documents
- **Microsoft Office**: .docx, .xlsx, .pptx, .doc, .xls, .ppt
- **OpenOffice/LibreOffice**: .odt, .ods, .odp
- **Rich Text**: .rtf

### PDF Documents
- PDF metadata and properties
- XMP metadata
- Document info dictionary
- Embedded files and attachments

### Images
- **Formats**: .jpg, .jpeg, .png, .gif, .tiff, .bmp
- **EXIF data**: Camera info, GPS coordinates, timestamps
- **IPTC data**: Copyright, keywords, captions
- **XMP data**: Advanced metadata

### Other Files
- **Archives**: .zip, .rar, .7z metadata
- **Audio**: .mp3, .wav, .m4a metadata
- **Video**: .mp4, .avi, .mov metadata

## Metadata Extracted

### Basic Properties
- File size and timestamps
- Hash values (MD5, SHA1, SHA256)
- File permissions
- File path information

### Author Information
- Document author(s)
- Creator organization
- Email addresses (if embedded)
- Previous authors/editors

### Software Fingerprinting
- Creating application
- Application version
- Operating system
- Fonts used
- Templates applied

### Hidden Content
- Tracked changes
- Comments and annotations
- Hidden text and sheets
- Custom properties
- Macros and scripts

### Revision History
- Revision count
- Editing time
- Modification timeline
- Version tracking

### Embedded Data
- Images and media
- Hyperlinks
- Embedded files
- Form fields

### Image-Specific (EXIF)
- Camera make and model
- GPS coordinates
- Capture timestamp
- Camera settings
- Software used
- Copyright information

## Usage Example

```bash
# Extract document metadata
python scripts/document_osint.py --file document.pdf --output report.json

# Extract all metadata including EXIF
python scripts/document_osint.py --file image.jpg --extract-all --include-exif

# Analyze Office document
python scripts/document_osint.py --file report.docx --extract-all
```

## Helper Scripts

- `document_osint.py`: Main document metadata extractor
- `exif_extractor.py`: Image EXIF data extraction
- `pdf_analyzer.py`: PDF-specific metadata
- `office_analyzer.py`: Microsoft Office document analysis
- `hidden_data_finder.py`: Hidden content discovery

## Risk Scoring

- **Critical**: Sensitive PII in metadata, active malware indicators
- **High**: Confidential author info, internal network paths, credentials
- **Medium**: Organization details, editing history, software versions
- **Low**: Basic metadata, public information, non-sensitive data

## Safety Rules

1. **Read-only**: Never modifies original documents
2. **Sandboxed analysis**: Processes files in isolated environment
3. **No execution**: Never runs macros or embedded scripts
4. **Privacy respect**: Redacts PII in reports where appropriate
5. **Legal compliance**: Respects copyright and data protection laws
6. **Scope focus**: Reports only on metadata, not document content
