# TenderFlow

### Tender Document Package Builder

A browser-based tool that helps office staff organize, verify, and combine tender documents into one submission-ready PDF package.

TenderFlow checks required documents, matches uploaded PDFs, detects duplicate files, validates expiry dates, and generates the final package in the correct order — all directly in the browser.

## 👤 Participant

**Name:** Fatin Sharhad 
**Registration Number:** `252-15-869`



## 🌐 Live Website

**Public HTTPS Live Link:**  
`https://fatin-sharhad-tenderflow.vercel.app/`

> The website is publicly accessible and does not require login or special permission.

---

## 📌 About the Project

Preparing a tender document package manually can be time-consuming and error-prone.

A missing document, expired certificate, duplicate file, or incorrectly ordered document can make a submission incomplete.

TenderFlow is designed to make this process easier by allowing users to load the tender requirements, upload their PDF documents, match them to the correct requirements, check their status, and generate a final combined PDF package.

The application runs entirely in the browser, so tender documents do not need to be uploaded to an external backend.

---

# ✨ Main Features

## 1. Tender Requirement Loading

- Loads the provided `requirements.json` format.
- Displays tender information such as:
  - Tender ID
  - Tender title
  - Procuring entity
  - Bidder
  - Submission deadline
- Displays requirements in the correct order.

## 2. Multiple PDF Upload

Users can upload multiple PDF files at once.

The application:

- Accepts PDF files only.
- Shows uploaded filenames.
- Shows the number of pages.
- Allows files to be removed.
- Enforces the contest file limits.

## 3. Document Matching

Users can match uploaded PDF files with the corresponding tender requirements.

A file can only be matched to one requirement, and a requirement can only have one matched file.

Matches can also be changed or removed.

## 4. Expiry Date Validation

For documents that require an expiry date, users can enter the expiry date.

The application checks the expiry date against the tender submission deadline.

A document expiring on the submission deadline is considered valid.

## 5. Document Status System

Every requirement receives a clear status:

- `OK`
- `Missing`
- `Expiry date needed`
- `Expired`
- `Not provided`

Blocking problems prevent package generation.

## 6. Duplicate Detection

The application detects PDF files with identical content even when their filenames are different.

Duplicate files are clearly marked and cannot be incorrectly assigned to different requirements.

## 7. Final PDF Generation

When all blocking issues are resolved, the user can generate the final tender package.

The generated PDF includes:

- English cover page
- Tender information
- Included document list
- Documents in the required order
- All pages from each selected PDF
- Page numbering/footer

## 8. Download

The generated package can be downloaded using the required naming format:

```text
<tender_id>_Package.pdf
