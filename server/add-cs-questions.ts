import { MongoDBStorage } from './storage';
import { connectToMongoDB } from './mongodb';
import { Question } from '@shared/schema';

/**
 * Adds 40 fresh computer science questions to the database
 */
async function addCSQuestions() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    console.log('Connected to MongoDB successfully');
    
    // Initialize storage
    const storage = new MongoDBStorage();
    
    // Define 40 questions
    const questions: Omit<Question, 'id'>[] = [
      {
        title: "Big O Notation",
        content: "What is the time complexity of binary search?",
        type: "mcq",
        category: "Algorithms",
        difficulty: "medium",
        options: [
          "O(1)",
          "O(log n)",
          "O(n)",
          "O(n log n)"
        ],
        correctAnswer: "O(log n)"
      },
      {
        title: "Data Structures",
        content: "Which data structure operates on a LIFO (Last In, First Out) principle?",
        type: "mcq",
        category: "Data Structures",
        difficulty: "medium",
        options: [
          "Queue",
          "Stack",
          "Linked List",
          "Binary Tree"
        ],
        correctAnswer: "Stack"
      },
      {
        title: "Sorting Algorithm",
        content: "What is the average time complexity of Quicksort?",
        type: "mcq",
        category: "Algorithms",
        difficulty: "medium",
        options: [
          "O(n)",
          "O(n log n)",
          "O(n²)",
          "O(log n)"
        ],
        correctAnswer: "O(n log n)"
      },
      {
        title: "Binary Trees",
        content: "What is the maximum number of nodes in a binary tree of height h?",
        type: "mcq",
        category: "Data Structures",
        difficulty: "medium",
        options: [
          "2^h",
          "2^(h+1) - 1",
          "h^2",
          "2^h - 1"
        ],
        correctAnswer: "2^(h+1) - 1"
      },
      {
        title: "Programming Paradigms",
        content: "Which of the following is NOT a paradigm of programming?",
        type: "mcq",
        category: "Programming",
        difficulty: "medium",
        options: [
          "Functional Programming",
          "Object-Oriented Programming",
          "Sequential Programming",
          "Procedural Programming"
        ],
        correctAnswer: "Sequential Programming"
      },
      {
        title: "Database Normalization",
        content: "What normal form eliminates transitive dependencies?",
        type: "mcq",
        category: "Databases",
        difficulty: "medium",
        options: [
          "First Normal Form (1NF)",
          "Second Normal Form (2NF)",
          "Third Normal Form (3NF)",
          "Fourth Normal Form (4NF)"
        ],
        correctAnswer: "Third Normal Form (3NF)"
      },
      {
        title: "Operating Systems",
        content: "Which scheduling algorithm is designed to prevent indefinite blocking of low-priority processes?",
        type: "mcq",
        category: "Operating Systems",
        difficulty: "medium",
        options: [
          "First-Come, First-Served (FCFS)",
          "Shortest Job Next (SJN)",
          "Priority Scheduling",
          "Round Robin"
        ],
        correctAnswer: "Round Robin"
      },
      {
        title: "Computer Networks",
        content: "Which layer of the OSI model is responsible for logical addressing and routing?",
        type: "mcq",
        category: "Networking",
        difficulty: "medium",
        options: [
          "Physical Layer",
          "Data Link Layer",
          "Network Layer",
          "Transport Layer"
        ],
        correctAnswer: "Network Layer"
      },
      {
        title: "Graph Theory",
        content: "What algorithm finds the shortest path from a single source to all other vertices in a weighted graph?",
        type: "mcq",
        category: "Algorithms",
        difficulty: "medium",
        options: [
          "Breadth-First Search",
          "Depth-First Search",
          "Dijkstra's Algorithm",
          "Prim's Algorithm"
        ],
        correctAnswer: "Dijkstra's Algorithm"
      },
      {
        title: "Web Development",
        content: "Which of the following is NOT a JavaScript framework or library?",
        type: "mcq",
        category: "Web Development",
        difficulty: "medium",
        options: [
          "React",
          "Angular",
          "Django",
          "Vue"
        ],
        correctAnswer: "Django"
      },
      {
        title: "Compiler Design",
        content: "What phase of compilation converts tokens into a parse tree?",
        type: "mcq",
        category: "Compilers",
        difficulty: "medium",
        options: [
          "Lexical Analysis",
          "Syntax Analysis",
          "Semantic Analysis",
          "Code Generation"
        ],
        correctAnswer: "Syntax Analysis"
      },
      {
        title: "Recursion",
        content: "What is a potential disadvantage of recursion compared to iteration?",
        type: "mcq",
        category: "Programming",
        difficulty: "medium",
        options: [
          "Code readability",
          "Memory overhead",
          "Algorithm expressiveness",
          "Debugging complexity"
        ],
        correctAnswer: "Memory overhead"
      },
      {
        title: "Software Engineering",
        content: "Which software development methodology emphasizes incremental and iterative development with tight feedback loops?",
        type: "mcq",
        category: "Software Engineering",
        difficulty: "medium",
        options: [
          "Waterfall",
          "Agile",
          "Spiral",
          "V-Model"
        ],
        correctAnswer: "Agile"
      },
      {
        title: "OOP Concepts",
        content: "What OOP concept describes the ability of a class to take on multiple forms?",
        type: "mcq",
        category: "Object-Oriented Programming",
        difficulty: "medium",
        options: [
          "Inheritance",
          "Encapsulation",
          "Polymorphism",
          "Abstraction"
        ],
        correctAnswer: "Polymorphism"
      },
      {
        title: "Memory Management",
        content: "What is the term for the situation when a program requests memory but the system has run out of available memory?",
        type: "mcq",
        category: "Operating Systems",
        difficulty: "medium",
        options: [
          "Memory Leak",
          "Memory Thrashing",
          "Memory Fragmentation",
          "Memory Overflow"
        ],
        correctAnswer: "Memory Overflow"
      },
      {
        title: "Cryptography",
        content: "Which of the following is an asymmetric encryption algorithm?",
        type: "mcq",
        category: "Security",
        difficulty: "medium",
        options: [
          "AES",
          "DES",
          "3DES",
          "RSA"
        ],
        correctAnswer: "RSA"
      },
      {
        title: "Regular Expressions",
        content: "Which regex pattern matches a string containing only letters (a-z, A-Z)?",
        type: "mcq",
        category: "Programming",
        difficulty: "medium",
        options: [
          "^[a-zA-Z]*$",
          "^[a-z]*$",
          "^[A-Z]*$",
          "^[0-9]*$"
        ],
        correctAnswer: "^[a-zA-Z]*$"
      },
      {
        title: "Concurrency",
        content: "What problem occurs when two or more processes/threads indefinitely wait for each other to release resources?",
        type: "mcq",
        category: "Operating Systems",
        difficulty: "medium",
        options: [
          "Race Condition",
          "Starvation",
          "Deadlock",
          "Context Switching"
        ],
        correctAnswer: "Deadlock"
      },
      {
        title: "Design Patterns",
        content: "Which design pattern provides a way to access elements of an aggregate object sequentially without exposing its underlying representation?",
        type: "mcq",
        category: "Software Engineering",
        difficulty: "medium",
        options: [
          "Observer Pattern",
          "Singleton Pattern",
          "Iterator Pattern",
          "Factory Pattern"
        ],
        correctAnswer: "Iterator Pattern"
      },
      {
        title: "Database Indexing",
        content: "What type of index is most commonly used to implement primary keys in relational databases?",
        type: "mcq",
        category: "Databases",
        difficulty: "medium",
        options: [
          "Hash Index",
          "B-Tree Index",
          "Bitmap Index",
          "Full-Text Index"
        ],
        correctAnswer: "B-Tree Index"
      },
      {
        title: "Artificial Intelligence",
        content: "Which algorithm uses heuristics to find a near-optimal solution in a reasonable time for complex problems?",
        type: "mcq",
        category: "Artificial Intelligence",
        difficulty: "medium",
        options: [
          "A* Search",
          "Brute Force",
          "Genetic Algorithm",
          "Decision Tree"
        ],
        correctAnswer: "Genetic Algorithm"
      },
      {
        title: "Dynamic Programming",
        content: "What is the primary characteristic of problems that can be solved efficiently using dynamic programming?",
        type: "mcq",
        category: "Algorithms",
        difficulty: "medium",
        options: [
          "Greedy Choice Property",
          "Optimal Substructure",
          "Linear Independence",
          "NP-completeness"
        ],
        correctAnswer: "Optimal Substructure"
      },
      {
        title: "Computer Architecture",
        content: "In a pipelined CPU, what hazard occurs when an instruction depends on the result of a previous instruction still in the pipeline?",
        type: "mcq",
        category: "Computer Architecture",
        difficulty: "medium",
        options: [
          "Structural Hazard",
          "Data Hazard",
          "Control Hazard",
          "Memory Hazard"
        ],
        correctAnswer: "Data Hazard"
      },
      {
        title: "Mobile Development",
        content: "Which mobile development approach uses web technologies to build cross-platform apps?",
        type: "mcq",
        category: "Mobile Development",
        difficulty: "medium",
        options: [
          "Native Development",
          "Hybrid Development",
          "Progressive Web Apps",
          "Reactive Development"
        ],
        correctAnswer: "Hybrid Development"
      },
      {
        title: "Cloud Computing",
        content: "Which cloud service model provides virtualized computing resources over the internet?",
        type: "mcq",
        category: "Cloud Computing",
        difficulty: "medium",
        options: [
          "Software as a Service (SaaS)",
          "Platform as a Service (PaaS)",
          "Infrastructure as a Service (IaaS)",
          "Function as a Service (FaaS)"
        ],
        correctAnswer: "Infrastructure as a Service (IaaS)"
      },
      {
        title: "API Design",
        content: "Which HTTP method is typically used for updating resources in a RESTful API?",
        type: "mcq",
        category: "Web Development",
        difficulty: "medium",
        options: [
          "GET",
          "POST",
          "PUT",
          "DELETE"
        ],
        correctAnswer: "PUT"
      },
      {
        title: "Functional Programming",
        content: "Which concept refers to functions that do not cause side effects and always return the same output for the same input?",
        type: "mcq",
        category: "Programming",
        difficulty: "medium",
        options: [
          "Higher-order functions",
          "Pure functions",
          "Lambda functions",
          "Recursive functions"
        ],
        correctAnswer: "Pure functions"
      },
      {
        title: "Machine Learning",
        content: "Which machine learning approach uses labeled data for training?",
        type: "mcq",
        category: "Artificial Intelligence",
        difficulty: "medium",
        options: [
          "Supervised Learning",
          "Unsupervised Learning",
          "Reinforcement Learning",
          "Semi-supervised Learning"
        ],
        correctAnswer: "Supervised Learning"
      },
      {
        title: "Version Control",
        content: "What Git command creates a copy of a repository on your local machine?",
        type: "mcq",
        category: "Software Engineering",
        difficulty: "medium",
        options: [
          "git pull",
          "git push",
          "git clone",
          "git commit"
        ],
        correctAnswer: "git clone"
      },
      {
        title: "Debugging Techniques",
        content: "What debugging technique involves adding statements to output the value of variables at specific points in the program?",
        type: "mcq",
        category: "Programming",
        difficulty: "medium",
        options: [
          "Breakpoints",
          "Print Debugging",
          "Remote Debugging",
          "Profiling"
        ],
        correctAnswer: "Print Debugging"
      },
      {
        title: "Distributed Systems",
        content: "What term describes the property of a distributed system where the failure of one component doesn't affect others?",
        type: "mcq",
        category: "Distributed Systems",
        difficulty: "medium",
        options: [
          "Scalability",
          "Fault Tolerance",
          "Concurrency",
          "Transparency"
        ],
        correctAnswer: "Fault Tolerance"
      },
      {
        title: "Computer Graphics",
        content: "Which rendering technique simulates the behavior of light by tracing rays from the camera to light sources?",
        type: "mcq",
        category: "Computer Graphics",
        difficulty: "medium",
        options: [
          "Scanline Rendering",
          "Ray Tracing",
          "Rasterization",
          "Z-buffering"
        ],
        correctAnswer: "Ray Tracing"
      },
      {
        title: "Data Mining",
        content: "Which clustering algorithm assigns each data point to the nearest cluster center?",
        type: "mcq",
        category: "Data Science",
        difficulty: "medium",
        options: [
          "K-Means",
          "DBSCAN",
          "Hierarchical Clustering",
          "Mean-Shift"
        ],
        correctAnswer: "K-Means"
      },
      {
        title: "Security Principles",
        content: "What security principle states that a system should not fail to a state that allows unauthorized access?",
        type: "mcq",
        category: "Security",
        difficulty: "medium",
        options: [
          "Defense in Depth",
          "Principle of Least Privilege",
          "Fail-secure",
          "Security by Obscurity"
        ],
        correctAnswer: "Fail-secure"
      },
      {
        title: "Information Theory",
        content: "What is the maximum amount of information that can be transmitted over a noisy channel?",
        type: "mcq",
        category: "Information Theory",
        difficulty: "medium",
        options: [
          "Channel Capacity",
          "Shannon Limit",
          "Nyquist Rate",
          "Hamming Distance"
        ],
        correctAnswer: "Channel Capacity"
      },
      {
        title: "Parallel Computing",
        content: "Which law states that the speed-up of a program using multiple processors is limited by the sequential fraction of the program?",
        type: "mcq",
        category: "Parallel Computing",
        difficulty: "medium",
        options: [
          "Moore's Law",
          "Amdahl's Law",
          "Gustafson's Law",
          "Little's Law"
        ],
        correctAnswer: "Amdahl's Law"
      },
      {
        title: "Assembly Language",
        content: "Which register typically stores the return value of a function in x86 assembly?",
        type: "mcq",
        category: "Low-level Programming",
        difficulty: "medium",
        options: [
          "EAX/RAX",
          "EBX/RBX",
          "ECX/RCX",
          "ESP/RSP"
        ],
        correctAnswer: "EAX/RAX"
      },
      {
        title: "Computer Ethics",
        content: "What ethical principle requires computing professionals to avoid causing harm to others?",
        type: "mcq",
        category: "Ethics",
        difficulty: "medium",
        options: [
          "Privacy",
          "Nonmaleficence",
          "Autonomy",
          "Justice"
        ],
        correctAnswer: "Nonmaleficence"
      },
      {
        title: "Digital Logic",
        content: "What digital circuit implements the Boolean function XOR?",
        type: "mcq",
        category: "Computer Architecture",
        difficulty: "medium",
        options: [
          "A gate that outputs 1 only when all inputs are 1",
          "A gate that outputs 1 only when all inputs are 0",
          "A gate that outputs 1 only when inputs have different values",
          "A gate that outputs 1 when at least one input is 1"
        ],
        correctAnswer: "A gate that outputs 1 only when inputs have different values"
      },
      {
        title: "Code Optimization",
        content: "Which optimization technique involves replacing a function call with the function body?",
        type: "mcq",
        category: "Compilers",
        difficulty: "medium",
        options: [
          "Dead Code Elimination",
          "Constant Folding",
          "Loop Unrolling",
          "Function Inlining"
        ],
        correctAnswer: "Function Inlining"
      }
    ];

    // Add questions to the database
    console.log('Adding 40 computer science questions to the database...');
    
    // Keep track of how many questions have been added
    let addedCount = 0;
    
    for (const question of questions) {
      try {
        await storage.createQuestion(question);
        addedCount++;
      } catch (error) {
        console.error(`Error adding question "${question.title}":`, error);
      }
    }
    
    console.log(`Successfully added ${addedCount} questions to the database`);
    
  } catch (error) {
    console.error('Failed to add questions:', error);
  }
}

// Run the function
addCSQuestions().then(() => {
  console.log('Finished adding questions');
  process.exit(0);
}).catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});