# Document Type Workflows - AutoDoxis

This document outlines all the routing workflows for different document types in the AutoDoxis system.

---

## 1. **Travel Order** (`TRAVEL ORDER`)

**Workflow Route:**
```
Sender → Immediate Supervisor → HR → Records Office → Executive Assistant → President → Records Office → HR → Back to Sender
```

**Stages:**
1. **Immediate Supervisor** (Initial Review)
2. **HR** (First Visit - Human Resources Review)
3. **Records Office** (First Visit - Record Keeping)
4. **Executive Assistant** (Executive Review)
5. **President** (Final Executive Approval)
6. **Records Office** (Second Visit - Final Record Keeping)
7. **HR** (Second Visit - Final Decision & Return to Sender)

**Special Notes:**
- Uses HR workflow (bypasses Program Head workflow)
- Has duplicate stages: Records Office and HR appear twice
- Final decision is made by HR on the second visit
- Includes special fields: Departure Date, Departure Time, Return Date, Return Time

---

## 2. **Faculty Loading** (`FACULTY LOADING`)

**Workflow Route:**
```
Sender → Program Head → Dean → Academic Vice President → Back to Sender
```

**Stages:**
1. **Program Head** (Department Review)
2. **Dean** (College/Faculty Review)
3. **Academic Vice President** (Final Academic Approval)

**Special Notes:**
- University-wide document (bypasses department restrictions)
- Workflow completes after Academic VP approval
- Document is returned to sender after final approval

---

## 3. **Endorsement Form** (`ENDORSEMENT FORM`)

**Workflow Route:**
```
Sender → Program Head → Dean → Vice President → Office of the President → Back to Sender
```

**Stages:**
1. **Program Head** (Department Review)
2. **Dean** (College/Faculty Review)
3. **Vice President** (VP Review)
4. **Office of the President** (Final Presidential Approval)

**Special Notes:**
- Updated workflow (previously started with Secretary)
- Goes through standard academic hierarchy
- Final approval by Office of the President

---

## 4. **Requested Subject** (`REQUESTED SUBJECT`)

**Workflow Route:**
```
Sender → Academic Adviser → Program Head → Dean → Director of Instruction → VPAA → Dean → Encoder → Back to Sender
```

**Stages:**
1. **Academic Adviser** (Initial Academic Review)
2. **Program Head** (Program Review)
3. **Dean** (First Visit - Dean Review)
4. **Director of Instruction** (Instruction Review)
5. **VPAA** (Vice President for Academic Affairs)
6. **Dean** (Second Visit - Final Dean Review)
7. **Encoder** (Final Processing & Encoding)

**Special Notes:**
- 7-stage workflow (longest workflow)
- Has duplicate stage: Dean appears twice (after Program Head and after VPAA)
- University-wide document
- Final processing by Encoder
- Handles resubmissions the same way as Travel Order (preserves routing history)

---

## 5. **Default/Other Document Types**

**Workflow Route:**
```
Sender → Program Head → Dean → Academic Vice President → Back to Sender
```

**Stages:**
1. **Program Head** (Department Review)
2. **Dean** (College/Faculty Review)
3. **Academic Vice President** (Final Academic Approval)

**Special Notes:**
- Standard workflow for all other document types
- Department-specific routing
- Most common workflow pattern

---

## Workflow Summary Table

| Document Type | Stages | Starting Office | Final Office | Special Features |
|--------------|--------|----------------|--------------|-----------------|
| **Travel Order** | 7 | Immediate Supervisor | HR (2nd visit) | HR workflow, duplicate stages, travel dates |
| **Faculty Loading** | 3 | Program Head | Academic VP | University-wide |
| **Endorsement Form** | 4 | Program Head | Office of the President | Presidential approval |
| **Requested Subject** | 7 | Academic Adviser | Encoder | Longest workflow, duplicate Dean stage, university-wide |
| **Default/Other** | 3 | Program Head | Academic VP | Standard workflow |

---

## Workflow Actions

At each stage, reviewers can take the following actions:

- **Approve & Forward**: Approve the document and send it to the next stage
- **Approve & Return**: Approve the document and return it to sender (final approval)
- **Reject**: Reject the document and return it to sender
- **Return for Editing**: Return the document to sender for corrections
- **On Hold**: Place the document on hold (temporary status)

---

## Notes

- All workflows track routing history with timestamps and processing times
- Documents can be returned at any stage for editing
- Workflow completion is determined by reaching the final stage and receiving approval
- Each office in the workflow can see documents assigned to them based on their position and department
- University-wide documents (Faculty Loading, Travel Order, Requested Subject) bypass department restrictions

---

*Last Updated: Based on current codebase implementation*

