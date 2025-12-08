# Development Priority List

## Current Status Summary

### ✅ Working Features
- Core quoting system (form, pricing, PDF generation)
- Employee portal (holidays, documents)
- Google Calendar integration
- Google Drive integration
- Google Sheets integration (pricing config)
- Basic authentication infrastructure

### ⚠️ Critical Issues to Fix

1. **Xero Integration** - Access tokens expire after 30 minutes, breaking company autocomplete
2. **Google Login** - Server-side OAuth implemented but may need verification/testing

---

## Priority Development Order

### 🔴 PRIORITY 1: Critical Fixes (IMMEDIATE - 1-2 weeks)

#### 1.1 Fix Xero Integration (URGENT - 1-2 days)
**Status**: ⚠️ Broken - tokens expire after 30 minutes  
**Impact**: Company autocomplete stops working, blocks quote creation workflow  
**Estimated Time**: 1-2 days

**Tasks**:
1. Create `xero_tokens` table to store refresh tokens
2. Implement refresh token flow in `api/lib/xero.ts`
3. Update `api/auth/xero/callback.ts` to store refresh token on OAuth callback
4. Create token refresh service that automatically refreshes expired tokens
5. Update `getXeroAccessToken()` to use refresh flow instead of static token
6. Test token expiration handling
7. Test refresh token flow end-to-end

**Files to Modify**:
- `api/lib/db.ts` - Add `xero_tokens` table
- `api/lib/xero.ts` - Implement refresh token flow
- `api/auth/xero/callback.ts` - Store refresh token

**Success Criteria**:
- Token refresh works automatically
- Company autocomplete functional 100% of time
- No manual token updates required

#### 1.2 Verify & Complete Google Login (1-2 days)
**Status**: ✅ Partially implemented - needs verification  
**Impact**: Authentication may not be working correctly  
**Estimated Time**: 1-2 days

**Tasks**:
1. Verify server-side OAuth flow is working
2. Test login flow end-to-end
3. Verify JWT cookie is set correctly
4. Test session persistence
5. Fix any issues found
6. Update redirect URIs in Google Cloud Console if needed
7. Test domain restriction (@creode.co.uk)

**Files to Check**:
- `api/auth/google/redirect.ts`
- `api/auth/google/callback.ts`
- `src/components/LoginPage.tsx`
- `src/contexts/AuthContext.tsx`

**Success Criteria**:
- Users can log in with Google OAuth
- Only @creode.co.uk emails can access
- Sessions persist correctly
- Logout works properly

#### 1.3 Complete Phase 1: Audit Trails Integration (1 week)
**Status**: ⚠️ Infrastructure exists but may not be fully integrated  
**Impact**: Required by all other features  
**Estimated Time**: 1 week

**Tasks**:
1. Verify audit logging is integrated in all existing features
2. Add audit logging to quote operations (if missing)
3. Add audit logging to employee operations (if missing)
4. Test audit log viewer
5. Document audit log structure
6. Ensure all actions are logged

**Success Criteria**:
- All actions logged to audit trails
- Audit log viewer functional
- Zero unlogged operations

---

### 🟠 PRIORITY 2: Core Business Workflow (HIGH - 3-6 weeks)

#### 2.1 Phase 2: Quote Approval System (3-4 weeks)
**Dependencies**: Phase 1 complete, Xero fixed  
**Impact**: Enables quote acceptance workflow  
**Estimated Time**: 3-4 weeks

**Key Features**:
- HelloSign integration
- Quote approval workflow
- Approval status tracking
- Email notifications

#### 2.2 Customer Onboarding System (4-5 weeks)
**Dependencies**: Phase 1 complete  
**Impact**: Needed for client portal and project management  
**Estimated Time**: 4-5 weeks

**Key Features**:
- Customer data collection
- Stakeholder management
- Contract signing
- Payment/PO configuration

#### 2.3 Phase 3: Ticketing System (4-5 weeks)
**Dependencies**: Phase 1, Phase 2  
**Impact**: Core project management feature  
**Estimated Time**: 4-5 weeks

**Key Features**:
- Ticket creation from quotes
- Kanban board with drag-and-drop
- Ticket assignment
- Comments and priorities

---

### 🟡 PRIORITY 3: Client Experience (MEDIUM-HIGH - 6-10 weeks)

#### 3.1 Client Portal System (6-8 weeks)
**Dependencies**: Phase 1, Customer Onboarding, Phase 3, Phase 2  
**Impact**: Major client-facing feature  
**Estimated Time**: 6-8 weeks

**Key Features**:
- Client login and authentication
- Ticket raising
- Project status viewing
- Time tracking for retainers
- Custom analytics dashboards (GA4, Meta, Shopify)

#### 3.2 NPS Surveys and Testimonials (2-3 weeks)
**Dependencies**: Phase 1, Phase 2  
**Impact**: Feedback collection for improvement  
**Estimated Time**: 2-3 weeks

**Key Features**:
- NPS score collection
- Testimonial collection
- Phase-level and project-level surveys
- Email integration

---

### 🟢 PRIORITY 4: Operations & Efficiency (MEDIUM - 4-8 weeks)

#### 4.1 Phase 4: Invoice Generation (3-4 weeks)
**Dependencies**: Phase 1, Phase 2  
**Impact**: Completes quote-to-invoice workflow  
**Estimated Time**: 3-4 weeks

**Key Features**:
- Xero invoice creation from accepted quotes
- Invoice tracking
- Payment status

#### 4.2 Phase 5: Phase Sign-Off System (4-5 weeks)
**Dependencies**: Phase 1, Phase 2, Phase 3  
**Impact**: Formal project milestone tracking  
**Estimated Time**: 4-5 weeks

**Key Features**:
- HelloSign phase sign-offs
- Ticket blocking until sign-off
- Waterfall and concurrent workflows

#### 4.3 Supplier Onboarding System (2-3 weeks)
**Dependencies**: Phase 1  
**Impact**: Streamlines freelancer onboarding  
**Estimated Time**: 2-3 weeks

**Key Features**:
- Supplier data collection
- Bank details management
- Terms acceptance

---

### 🔵 PRIORITY 5: Advanced Features (MEDIUM - 9-17 weeks)

#### 5.1 Call Transcription System (4-5 weeks)
**Dependencies**: Phase 1, Customer Onboarding  
**Impact**: Foundation for AI analysis  
**Estimated Time**: 4-5 weeks

**Key Features**:
- Call transcription (video, VOIP, in-person, mobile)
- AI key point extraction
- Call type detection
- Link to clients/projects

#### 5.2 AI Analysis of Communications (5-6 weeks)
**Dependencies**: Phase 1, Call Transcription  
**Impact**: Client health monitoring  
**Estimated Time**: 5-6 weeks

**Key Features**:
- Sentiment analysis
- Problem detection
- Client health scores
- Early warning system (admin only)

#### 5.3 PDP and Performance Review System (5-6 weeks)
**Dependencies**: Phase 1, Employee Portal  
**Impact**: HR/performance management  
**Estimated Time**: 5-6 weeks

**Key Features**:
- Performance reviews
- SMART goals with validation
- Calendar scheduling
- Feedback forms

---

### ⚪ PRIORITY 6: Documentation & Quality (LOW-MEDIUM - 9-11 weeks)

#### 6.1 Phase 6: Documentation Management (4-5 weeks)
**Dependencies**: Phase 1  
**Impact**: Documentation editing capabilities  
**Estimated Time**: 4-5 weeks

**Key Features**:
- WYSIWYG editor (Tiptap)
- Documentation storage
- Version control

#### 6.2 AI Documentation Review System (5-6 weeks)
**Dependencies**: Phase 1, Phase 6  
**Impact**: Automated documentation maintenance  
**Estimated Time**: 5-6 weeks

**Key Features**:
- AI review (manual and scheduled)
- Technology change detection
- Legislation change detection
- Human approval workflow

---

## Quick Reference: Implementation Waves

### Wave 1: Foundation (1-2 weeks) 🔴
1. Fix Xero Integration
2. Verify Google Login
3. Complete Phase 1 Integration

### Wave 2: Core Workflow (3-6 weeks) 🟠
4. Phase 2: Quote Approval
5. Customer Onboarding
6. Phase 3: Ticketing

### Wave 3: Client Experience (6-10 weeks) 🟡
7. Client Portal
8. NPS Surveys

### Wave 4: Operations (4-8 weeks) 🟢
9. Phase 4: Invoice Generation
10. Phase 5: Phase Sign-Off
11. Supplier Onboarding

### Wave 5: Advanced Features (9-17 weeks) 🔵
12. Call Transcription
13. AI Analysis of Communications
14. PDP and Performance Reviews

### Wave 6: Documentation (9-11 weeks) ⚪
15. Phase 6: Documentation Management
16. AI Documentation Review

---

## Parallel Development Opportunities

These can be developed in parallel:

- **Phase 6** (Documentation Management) can start after Phase 1, parallel with Waves 2-4
- **Supplier Onboarding** can be developed in parallel with Customer Onboarding
- **NPS Surveys** can be developed in parallel with Phase 3
- **Phase 4** (Invoice Generation) can be developed in parallel with Phase 3

---

## Critical Path (Minimum Viable Product)

For fastest time to value:

1. ✅ Fix Xero Integration (1-2 days)
2. ✅ Verify Google Login (1-2 days)
3. ✅ Complete Phase 1 (1 week)
4. ✅ Phase 2: Quote Approval (3-4 weeks)
5. ✅ Customer Onboarding (4-5 weeks)
6. ✅ Phase 3: Ticketing (4-5 weeks)
7. ✅ Client Portal - Basic Version (4-6 weeks)

**Total MVP Time**: ~14-20 weeks

---

## Risk Assessment

### High Risk Items
- **Xero Integration**: Currently blocking quote workflow
- **Phase 1 Audit Trails**: Required by all other features
- **Client Portal**: Complex, many dependencies

### Medium Risk Items
- **AI Features**: May require prompt engineering and iteration
- **Call Transcription**: Depends on third-party services
- **Analytics Dashboards**: Complex integrations (GA4, Meta, Shopify)

### Low Risk Items
- **Supplier Onboarding**: Straightforward data collection
- **NPS Surveys**: Well-defined requirements
- **Documentation Management**: Standard CRUD operations

---

## Next Immediate Steps

### This Week:
1. **Fix Xero Integration** (Day 1-2)
   - Implement refresh token storage
   - Create refresh service
   - Test end-to-end

2. **Verify Google Login** (Day 2-3)
   - Test login flow
   - Fix any issues
   - Verify domain restriction

3. **Complete Phase 1** (Day 3-5)
   - Verify audit logging integration
   - Add missing audit logs
   - Test audit viewer

### Next Week:
4. **Begin Phase 2: Quote Approval**
   - Set up HelloSign integration
   - Create approval workflow
   - Build approval UI

---

## Notes

- All estimated times are rough estimates and may vary
- Dependencies must be completed before dependent features
- Parallel development can speed up overall timeline
- Focus on MVP first, then add advanced features
- Regular testing and integration is critical

---

*Last Updated: [Current Date]*
*Next Review: After Wave 1 completion*

