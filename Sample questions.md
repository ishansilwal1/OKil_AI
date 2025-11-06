# 🧪 Sample Questions for Testing Nepali Legal AI System

## ✅ Enhanced System Fixes Applied:
- Improved fundamental rights extraction with better pattern matching
- Enhanced age information extraction for marriage, voting, etc.
- Better process step extraction for procedural questions
- Added specialized handlers for tax and property questions
- More accurate source citations and legal reference extraction

---

## 📝 **FUNDAMENTAL RIGHTS Questions (Should now work properly!)**

### English Questions:
1. "What are the fundamental rights in Nepal?"
2. "List all fundamental rights guaranteed by Nepal's Constitution"
3. "What rights do citizens have under Nepal's Constitution?"
4. "Can you enumerate the basic rights of Nepali citizens?"

### Nepali Questions:
5. "नेपालका मौलिक अधिकारहरू के के हुन्?"
6. "संविधानमा उल्लेख भएका नागरिकका अधिकारहरू"

**Expected Output:** Should now list 10-15 specific fundamental rights like:
- Right to life with dignity
- Right to equality before law  
- Right to freedom of expression
- Right to education, etc.

---

## 🎂 **AGE-RELATED Questions (Now more accurate!)**

### Marriage Age:
7. "What is the legal age for marriage in Nepal?"
8. "नेपालमा विवाह गर्ने न्यूनतम उमेर कति हो?"
9. "At what age can someone legally marry in Nepal?"

### Voting Age:
10. "What is the minimum voting age in Nepal?"
11. "कति वर्षमा मतदान गर्न सकिन्छ?"

**Expected Output:** Should give specific ages (20 for marriage, 18 for voting)

---

## ⚖️ **PROCESS Questions (Much improved!)**

### Prime Minister Election:
12. "What is the process to elect Prime Minister in Nepal?"
13. "How is the PM appointed according to Nepal's Constitution?"
14. "प्रधानमन्त्री कसरी नियुक्त गरिन्छ?"

### General Election Process:
15. "What is the election process in Nepal?"
16. "How are representatives elected?"

**Expected Output:** Should now provide step-by-step process with proper legal procedures

---

## 👥 **DUTIES & RESPONSIBILITIES**

### Citizens' Duties:
17. "What are the duties of citizens in Nepal?"
18. "नागरिकका कर्तव्यहरू के के हुन्?"

### Government Officials:
19. "What are the duties of the Prime Minister?"
20. "What are the powers of the President?"
21. "What is the role of the Supreme Court?"

---

## 💰 **TAX Questions (New specialized handler!)**

22. "How much tax should I pay for earning 10 lakhs a year?"
23. "What are the income tax rates in Nepal?"
24. "कर कसरी तिर्ने?"
25. "What is the tax structure for businesses?"

**Expected Output:** Should provide tax slab information and calculation guidance

---

## 🏡 **PROPERTY & LAND Questions (New specialized handler!)**

### Agricultural Land:
26. "What are the purposes agricultural land can be used for?"
27. "Can agricultural land be converted for other uses?"
28. "कृषि जग्गाको प्रयोग कसरी गर्ने?"

### Property Rights:
29. "What are the property rights in Nepal?"
30. "How can I register property?"

**Expected Output:** Should list specific permitted uses and legal procedures

---

## 📋 **DEFINITION Questions**

31. "What is federalism according to Nepal's Constitution?"
32. "Define secularism in Nepali context"
33. "What does republicanism mean in Nepal?"

---

## 🏛️ **GOVERNMENT STRUCTURE**

34. "What is the structure of Nepal's government?"
35. "How many provinces are there in Nepal?"
36. "What are the three levels of government?"

---

## ⚖️ **LEGAL PROCEDURES**

37. "What is the process to file a case in court?"
38. "How to register a complaint?"
39. "What are the steps for constitutional remedy?"

---

## 🚨 **RIGHTS VIOLATIONS & REMEDIES**

40. "What to do if fundamental rights are violated?"
41. "How to seek constitutional remedy?"
42. "What are the penalties for discrimination?"

---

## 🔍 **Testing Instructions:**

1. **Run the system:** Use `run_enhanced_rag.bat` or `python conversational_rag.py`

2. **Test systematically:** Start with fundamental rights questions to verify the main fixes

3. **Check for improvements:**
   - Fundamental rights should now list 10+ specific rights instead of random child rights
   - Age questions should give accurate answers (20 for marriage, 18 for voting)
   - Process questions should provide step-by-step procedures
   - Tax and property questions should have specialized responses

4. **Quality indicators to look for:**
   - Structured numbered lists
   - Proper source citations (📚 Sources, ⚖️ Legal References)
   - Relevant content (not random excerpts)
   - Accurate legal information

5. **Report any issues:** Note which question types still need improvement

---

## 🎯 **Priority Test Questions (Try these first!):**

**HIGH PRIORITY:**
- "What are the fundamental rights in Nepal?" (This was the main issue)
- "What is the legal age for marriage in Nepal?" (Should now be accurate)
- "What is the process to elect Prime Minister?" (Should be much better structured)

**MEDIUM PRIORITY:**
- Tax and property questions (New features to test)
- Duties of citizens (General improvement)

**LOW PRIORITY:**
- Complex legal definitions (Existing functionality)

---

*The system should now provide much more accurate, structured, and comprehensive answers. The improvements specifically target the issues you mentioned about random/incomplete responses.*