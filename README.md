VectorDB — High-Performance Vector Database in C++

A fully functional Vector Database built from scratch in C++, designed to demonstrate how modern semantic search systems work under the hood. This project combines multiple search algorithms, real embeddings, and a RAG (Retrieval-Augmented Generation) pipeline into a single system with an interactive web interface.

Overview

VectorDB enables efficient similarity search over high-dimensional data. It supports both synthetic demo vectors and real-world text embeddings, allowing users to explore how vector databases power modern AI applications like semantic search, recommendation systems, and chatbots.

Key Features
Multi-Algorithm Search Engine
HNSW (Hierarchical Navigable Small World) — fast, scalable approximate nearest neighbor search
KD-Tree — exact search optimized for low-dimensional data
Brute Force — baseline exact comparison
Distance Metrics
Cosine Similarity
Euclidean Distance
Manhattan Distance
Real-Time Visualization
2D PCA projection of vectors
Interactive scatter plot showing semantic clusters
Document Embedding System
Converts text into 768-dimensional embeddings
Automatically chunks large documents
Stores embeddings in a dedicated vector index
RAG Pipeline (AI Question Answering)
Retrieves relevant document chunks using vector search
Uses a local LLM to generate answers based on retrieved context
Ensures responses are grounded in user-provided data
REST API
Full backend exposed via HTTP endpoints
Supports insert, delete, search, benchmarking, and querying
How It Works
Text Input
   ↓
Embedding Model → Converts text into vector representation
   ↓
Vector Index (HNSW / KD-Tree / Brute Force)
   ↓
Similarity Search → Finds nearest vectors
   ↓
(Optional) LLM → Generates response using retrieved context
Core Components
Vector Search Engine

Implements three different approaches to nearest neighbor search:

Brute Force: Linear scan across all vectors
KD-Tree: Space-partitioning structure for faster exact queries
HNSW: Graph-based structure enabling near O(log N) search
Document Database
Stores real embeddings generated from text
Uses HNSW for efficient retrieval in high dimensions
RAG System
Combines retrieval + generation
Retrieves top-k relevant chunks
Passes them to an LLM for context-aware answers
Project Architecture
Frontend (Web UI)
   ↓
REST API (C++ Server)
   ↓
Vector Engine
   ├── HNSW
   ├── KD-Tree
   └── Brute Force
   ↓
Embedding + LLM Layer
Use Cases
Semantic search engines
AI-powered chatbots
Document question-answering systems
Recommendation systems
Learning and experimentation with vector databases
Highlights
Built entirely in C++ for performance and low-level control
Demonstrates production-grade concepts used in modern vector DBs
Combines algorithms + visualization + AI pipeline in one project
Designed as both a learning tool and portfolio project
Conclusion

This project showcases how a complete vector database system works — from mathematical foundations to real-world AI applications. It bridges the gap between theory and implementation by integrating search algorithms, embeddings, and LLM-based reasoning into a unified system.
