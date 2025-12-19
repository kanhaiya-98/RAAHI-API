# Contributing to RAAHI API

Thank you for considering contributing to RAAHI API! 🎉

## 📋 Table of Contents

- [Code of Team Conduct](#code-of-conduct)  
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)

---

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers warmly
- Focus on constructive feedback
- Respect differing viewpoints

---

## 🚀 Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
git clone https://github.com/YOUR_USERNAME/raahi-api.git
cd raahi-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Add your API keys
```

### 4. Run Tests

```bash
.\test-complete.ps1
```

---

## 🔄 Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes  
- `docs/` - Documentation
- `refactor/` - Code refactoring

Example: `feature/add-payment-gateway`

### Commit Messages

Follow conventional commits:

```
feat: add payment gateway integration
fix: resolve OTP expiry issue
docs: update API documentation
refactor: improve AI service error handling
```

### Development Process

1. Create feature branch
2. Make changes
3. Add tests
4. Run test suite
5. Commit with clear message
6. Push and create PR

---

## 📥 Pull Request Process

1. **Update Documentation**: If you add features, update relevant docs
2. **Add Tests**: New features must include tests
3. **Pass All Tests**: Run `.\test-complete.ps1` successfully
4. **Clear Description**: Explain what and why in PR description
5. **Link Issues**: Reference related issues with `#issue_number`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for features
- [ ] Manual testing completed

## Related Issues
Fixes #issue_number
```

---

## 💻 Coding Standards

### JavaScript Style

- Use ES6+ features
- Async/await over promises
- Clear variable names
- Comments for complex logic

### File Organization

```javascript
// 1. Imports
const express = require('express');
const { supabase } = require('../config/database');

// 2. Constants
const MAX_RETRIES = 3;

// 3. Helper functions
const calculateDistance = () => {};

// 4. Main logic
const createTask = async (req, res) => {};

// 5. Exports
module.exports = { createTask };
```

### Error Handling

Always use try-catch blocks:

```javascript
const myFunction = async (req, res, next) => {
  try {
    // Logic here
  } catch (error) {
    next(error); // Pass to error handler
  }
};
```

---

## 🧪 Testing Guidelines

### Test Requirements

- All new features must have tests
- Maintain test coverage > 80%
- Test both success and failure cases

### Running Tests

```powershell
# Full test suite
.\test-complete.ps1

# Quick tests
.\test-api.ps1
```

### Writing Tests

```javascript
describe('Task Controller', () => {
  it('should create task with AI classification', async () => {
    // Test code
  });
  
  it('should handle missing data gracefully', async () => {
    // Test error cases
  });
});
```

---

## 📦 Adding Dependencies

Before adding new dependencies:

1. Check if existing package can solve the problem
2. Verify package is actively maintained
3. Check security vulnerabilities
4. Update `package.json`
5. Document why it's needed in PR

---

## 🐛 Reporting Bugs

Use GitHub Issues with template:

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**
1. Step 1
2. Step 2

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Windows/Mac/Linux
- Node version: v18.x
- RAAHI API version: 1.0.0
```

---

## 💡 Suggesting Features

Use GitHub Issues with template:

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this needed?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you considered
```

---

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference!

**Questions?** Open a discussion on GitHub!

---

<div align="center">

⭐ Star the repo if you find it useful!

</div>
