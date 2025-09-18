#!/usr/bin/env python3
"""
Comprehensive Demo: Enhanced Legal RAG System
Demonstrates improved performance with 300-350 character chunks
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from legal_rag_system import EnhancedLegalRAG
import json

def demo_enhanced_performance():
    """Comprehensive demonstration of enhanced RAG capabilities"""
    
    print("ENHANCED LEGAL RAG SYSTEM DEMO")
    print("="*50)
    print("Improvements:")
    print("- Optimized 300-350 character chunks")
    print("- Enhanced keyword + semantic search")
    print("- Source diversity algorithms")
    print("- Multi-language support (Nepali/English)")
    print("- Improved contextual ranking")
    print()
    
    # Test queries covering different legal domains
    demo_queries = [
        ("Constitutional Rights", "en", "What are the fundamental rights guaranteed by Nepal's Constitution?"),
        ("Land Use", "en", "What are the restrictions on agricultural land use in Nepal?"),
        ("संविधान", "ne", "नेपालको संविधानमा मौलिक अधिकार के के छन्?"),
        ("Property Tax", "en", "How is property tax calculated in Nepal?"),
        ("भूमि", "ne", "कृषि भूमिको प्रयोग सम्बन्धी नियम के छ?"),
        ("Civil Code", "en", "What does the civil code say about marriage registration?"),
        ("वित्तीय", "ne", "बैंकिङ्ग कारोबारका नियमहरू के छन्?"),
        ("Constitutional Structure", "en", "How is the federal government structured according to the Constitution?")
    ]
    
    try:
        # Initialize the enhanced RAG system
        rag = EnhancedLegalRAG()
        
        results = []
        
        # Test each query
        for i, (category, lang, query) in enumerate(demo_queries, 1):
            print(f"\n{'DEMO QUERY ' + str(i):=^70}")
            print(f"Category: {category}")
            print(f"Language: {lang}")
            print(f"Query: {query}")
            print("-" * 70)
            
            try:
                search_results = rag.search(query, top_k=3, debug=False)
                
                if search_results:
                    print(f"Found {len(search_results)} relevant results")
                    
                    # Store performance data
                    result_data = {
                        'category': category,
                        'language': lang,
                        'query': query,
                        'result_count': len(search_results),
                        'scores': [r['score'] for r in search_results],
                        'sources': [r['source'] for r in search_results],
                        'match_types': [r['match_type'] for r in search_results]
                    }
                    results.append(result_data)
                    
                    avg_score = sum(r['score'] for r in search_results) / len(search_results)
                    
                    # Display results
                    for j, result in enumerate(search_results, 1):
                        print(f"\n{j}. [{result['match_type'].upper()}] Score: {result['score']:.3f}")
                        print(f"   Source: {result['source']}")
                        print(f"   Length: {result['char_count']} chars")
                        if result['article_number']:
                            print(f"   Article: {result['article_number']}")
                        
                        # Show text preview
                        text_preview = result['text']
                        print(f"   Text: {text_preview}")
                        print()
                    
                    avg_score /= len(search_results)
                    
                    # Result analysis
                    print(f"ANALYSIS:")
                    print(f"   • Average Score: {avg_score:.3f}")
                    print(f"   • Sources: {', '.join(set(r['source'] for r in search_results))}")
                    print(f"   • Methods: {', '.join(set(r['match_type'] for r in search_results))}")
                    
                    # Character count statistics
                    char_counts = [r['char_count'] for r in search_results]
                    print(f"   • Chunk Sizes: {min(char_counts)}-{max(char_counts)} chars")
                    
                    # Relevance assessment
                    high_relevance = len([r for r in search_results if r['score'] > 5.0])
                    print(f"   • High Relevance Results: {high_relevance}/{len(search_results)}")
                    
                else:
                    print("No results found")
                    results.append({
                        'category': category,
                        'language': lang,
                        'query': query,
                        'result_count': 0,
                        'scores': [],
                        'sources': [],
                        'match_types': []
                    })
                    
            except Exception as e:
                print(f"Error: {e}")
                results.append({
                    'category': category,
                    'language': lang,
                    'query': query,
                    'error': str(e)
                })
        
        # Performance summary
        print(f"\n{'PERFORMANCE SUMMARY':=^70}")
        
        successful_queries = [r for r in results if 'error' not in r and r['result_count'] > 0]
        total_queries = len(demo_queries)
        successful_count = len(successful_queries)
        
        if successful_queries:
            avg_results_per_query = sum(r['result_count'] for r in successful_queries) / len(successful_queries)
            all_scores = []
            for r in successful_queries:
                all_scores.extend(r['scores'])
            avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
            
            best_scores = [max(r['scores']) if r['scores'] else 0 for r in successful_queries]
            
            all_sources = set()
            all_match_types = set()
            for r in successful_queries:
                all_sources.update(r['sources'])
                all_match_types.update(r['match_types'])
            
            print(f"Success Rate: {successful_count}/{total_queries} ({successful_count/total_queries*100:.1f}%)")
            print(f"Average Results per Query: {avg_results_per_query:.1f}")
            print(f"Average Score: {avg_score:.3f}")
            print(f"Best Score Range: {min(best_scores):.3f} - {max(best_scores):.3f}")
            print(f"Data Sources Utilized: {len(all_sources)}")
            print(f"   {', '.join(sorted(all_sources))}")
            print(f"Search Methods Used: {', '.join(sorted(all_match_types))}")
            
            # Language performance
            nepali_results = [r for r in successful_queries if r['language'] == 'ne']
            english_results = [r for r in successful_queries if r['language'] == 'en']
            
            print(f"\nLanguage Performance:")
            if nepali_results:
                nepali_scores = []
                for r in nepali_results:
                    nepali_scores.extend(r['scores'])
                nepali_avg = sum(nepali_scores) / len(nepali_scores) if nepali_scores else 0
                print(f"   Nepali: {nepali_avg:.3f} avg ({len(nepali_results)} queries)")
            
            if english_results:
                english_scores = []
                for r in english_results:
                    english_scores.extend(r['scores'])
                english_avg = sum(english_scores) / len(english_scores) if english_scores else 0
                print(f"   English: {english_avg:.3f} avg ({len(english_results)} queries)")
            
            print(f"\nCorpus Utilization:")
            for source in sorted(all_sources):
                source_count = sum(1 for r in successful_queries if source in r['sources'])
                print(f"   {source}: {source_count} queries")
        
        else:
            print("No successful queries to analyze")
        
        # Enhanced RAG benefits
        print(f"\n{'ENHANCED RAG BENEFITS':=^70}")
        print("• Multi-source legal corpus integration")
        print("• Optimized chunk sizes for better context")
        print("• Advanced keyword + semantic search")
        print("• Source diversity algorithms")
        print("• Bilingual query processing")
        print("• Contextual result ranking")
        print("• Article/section identification")
        
        # Save results
        with open('demo_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\nResults saved to: demo_results.json")
        
    except Exception as e:
        print(f"Failed to initialize demo: {e}")

if __name__ == "__main__":
    demo_enhanced_performance()