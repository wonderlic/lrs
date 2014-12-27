DB installation:

1. Install Mondo DB.
2. Create "lrs" DB.
3. Create "statements" collection within "lrs" DB.  

    use lrs
    db.createCollection("statements");  

4. Create index for courseId field:
    
    use lrs
    db.statements.ensureIndex({ "context.extensions.http://easygenerator/expapi/course/id" : 1});  