# Themis

## 🎯 Project Overview
Inspired by the Greek goddess of justice, protection, and enforcement, our project is an AI-driven Smart Redaction Engine built specifically for high-stakes legal and investigative documents involving survivors of sexual assault. Unlike standard tools, Themis doesn’t just look for names; it understands context.

##### Tracts:
- **Mind Matters** 🧠

##### Implements:
- **Gemini API** 
- **MongoDB Atlas** 
- **Snowflake API** 

##### Key Features
- ** !!!add in ai component here
- **Deep Scrubbing**: Strips metadata, GPS coordinates, and hidden text layers
- **Human-in-the-Loop Review**: An interactive interface that allows users to review, approve, and refine AI-suggested redactions, with the ability to manually add any missed content.
- **Split-View Editor**: Side-by-side comparison of original and redacted documents

# 🏗️ Architecture

### Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **AI Processing**: Google Gemini API (for contextual understanding)
- **Database**: MongoDB Atlas (for storing flags)
- **Analytics**: Snowflake (for secure document storage)

### Data Flow

1. **Upload**: User uploads legal PDF document(s)
2. **Analysis**: Gemini scans for identity clusters and quasi-identifiers
3. **Storage**: MongoDB stores detected patterns and redaction suggestions
4. **Review**: User reviews and approves/rejects redactions via interactive UI
5. **Finalization**: Snowflake receives cleaned data with risk assessment report

## 💻 Usage

### Upload Documents

1. Navigate to the upload page
2. Drag and drop PDF/DOC/DOCX files or click "Browse"
3. Review selected files in the list
4. Click "Begin Redaction" to process

### Review Redactions

1. View split-screen comparison of original and redacted documents
2. Review suggested redactions in the sidebar
3. Click any redaction to open the review modal
4. Accept (Ctrl+Enter) or Reject (Escape) each suggestion
5. Edit suggested replacements as needed
6. Navigate between redactions using arrow keys
7. Download final redacted document

### Redaction Types

- **Names**: Direct identifiers (replaced with generic placeholders)
- **Locations**: Addresses, landmarks, specific places
- **Job Titles**: Unique professional identifiers
- **Relationships**: Family members, colleagues with identifying details

### Risk Levels

- **High**: Unique identifiers that directly expose the individual
- **Medium**: Contextual information that could aid re-identification
- **Low**: General information with minimal risk

## 🎯 Future Enhancements

- PDF rendering for actual document display
- Batch processing for multiple documents
- Export to various formats (PDF, DOCX)
- Audit trail for compliance
- Machine learning model fine-tuning
- Integration with case management systems
- Multi-language support
- Real-time collaboration features





