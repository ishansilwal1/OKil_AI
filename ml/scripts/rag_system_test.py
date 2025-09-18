#!/usr/bin/env python3
"""
Simple test script for the Enhanced Legal RAG System
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from legal_rag_system import EnhancedLegalRAG

def test_queries():
    """Test the enhanced RAG with sample queries"""
    print("Testing Enhanced Legal RAG System")
    print("=" * 50)
    
    # Initialize RAG
    rag = EnhancedLegalRAG()
    
    test_queries = input("Enter test queries (comma-separated): ").split(',')
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {query}")
        print("="*60)
        
        try:
            results = rag.search(query, top_k=3, debug=False)
            
            if results:
                for j, result in enumerate(results, 1):
                    print(f"\n{j}. [{result['match_type']}] Score: {result['score']}")
                    print(f"   Source: {result['source']}")
                    print(f"   Text: {result['text']}")
                    if result['article_number']:
                        print(f"   Article: {result['article_number']}")
            else:
                print("No results found")
                
        except Exception as e:
            print(f"Error: {e}")
    
    print(f"\nTesting completed!")

if __name__ == "__main__":
    test_queries()