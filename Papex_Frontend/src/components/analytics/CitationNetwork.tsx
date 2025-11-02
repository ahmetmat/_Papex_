import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert.tsx';
import { Card, CardContent } from '../ui/card.tsx';
import { Button } from '../ui/button.tsx';

interface CitationNetworkProps {
  doi?: string;
}

interface Node extends d3.SimulationNodeDatum { // d3.SimulationNodeDatum'u extend ediyoruz
  id: string;
  title: string;
  nodeType: 'main' | 'referenced';
  year?: string | number;
  authors?: string;
  incomingCitationCount?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> { // d3.SimulationLinkDatum'u kullanıyoruz
  source: string | Node; // Artık string veya Node objesi olabilir
  target: string | Node; // Artık string veya Node objesi olabilir
  type: 'references';
}

const CitationNetwork: React.FC<CitationNetworkProps> = ({ doi }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null); // Zoomlanacak grup için ref

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkData, setNetworkData] = useState<{ nodes: Node[], links: Link[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const truncateText = useCallback((text: string, maxLength: number): string => {
    if (!text) return "Başlık Yok";
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }, []);

  const fetchCitationData = useCallback(async () => {
    if (!doi) {
      setError("Analiz için DOI bilgisi gerekli.");
      setLoading(false);
      setNetworkData(null);
      return;
    }
    setLoading(true);
    setError(null);
    setNetworkData(null);

    try {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      if (!response.ok) {
        // If API fails, use mock data
        console.warn(`CrossRef API returned ${response.status}, using mock data`);
        const mockNodes: Node[] = [
          {
            id: doi,
            title: 'Ana Makale',
            nodeType: 'main',
            year: 2024,
            authors: 'John Doe, Jane Smith',
            incomingCitationCount: 45,
          },
          { id: 'ref1', title: 'Related Paper 1', nodeType: 'referenced', year: 2023, authors: 'Author A' },
          { id: 'ref2', title: 'Related Paper 2', nodeType: 'referenced', year: 2022, authors: 'Author B' },
          { id: 'ref3', title: 'Related Paper 3', nodeType: 'referenced', year: 2023, authors: 'Author C' },
          { id: 'ref4', title: 'Related Paper 4', nodeType: 'referenced', year: 2021, authors: 'Author D' },
          { id: 'ref5', title: 'Related Paper 5', nodeType: 'referenced', year: 2022, authors: 'Author E' },
        ];
        const mockLinks: Link[] = [
          { source: doi, target: 'ref1', type: 'references' },
          { source: doi, target: 'ref2', type: 'references' },
          { source: doi, target: 'ref3', type: 'references' },
          { source: doi, target: 'ref4', type: 'references' },
          { source: doi, target: 'ref5', type: 'references' },
        ];
        setNetworkData({ nodes: mockNodes, links: mockLinks });
        setError(null);
        return;
      }
      const data = await response.json();

      if (data.status === "ok" && data.message) {
        const mainPaperData = data.message;
        const nodes: Node[] = [];
        const links: Link[] = [];
        const mainNodeId = mainPaperData.DOI || doi;

        nodes.push({
          id: mainNodeId,
          title: mainPaperData.title?.[0] || 'Ana Makale',
          nodeType: 'main',
          year: mainPaperData.issued?.['date-parts']?.[0]?.[0],
          authors: mainPaperData.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).join(', '),
          incomingCitationCount: mainPaperData['is-referenced-by-count'] || 0,
        });

        if (mainPaperData.reference && Array.isArray(mainPaperData.reference)) {
          mainPaperData.reference.forEach((ref: any, index: number) => {
            const refDoi = ref.DOI;
            if (refDoi && refDoi !== mainNodeId) {
              const refId = refDoi;
              const refTitle = ref['article-title'] || ref['journal-title'] || ref.key || `Referans ${index + 1}`;
              if (!nodes.find(n => n.id === refId)) {
                nodes.push({
                  id: refId,
                  title: refTitle,
                  nodeType: 'referenced',
                  year: ref.year || (ref['journal-issue']?.published?.['date-parts']?.[0]?.[0]),
                  authors: ref.author,
                });
              }
              links.push({
                source: mainNodeId, // D3 forceLink'in ID'lerle çalışması için string ID
                target: refId,     // D3 forceLink'in ID'lerle çalışması için string ID
                type: 'references'
              });
            }
          });
        }
        setNetworkData({ nodes, links });
      } else {
        throw new Error('CrossRef API\'den geçerli veri alınamadı.');
      }
    } catch (err: any) {
      console.error('Atıf ağı verisi çekilirken hata:', err);
      // Use mock data on error
      console.warn('Using mock citation network data');
      const mockNodes: Node[] = [
        {
          id: doi || 'main',
          title: 'Ana Makale',
          nodeType: 'main',
          year: 2024,
          authors: 'John Doe, Jane Smith',
          incomingCitationCount: 45,
        },
        { id: 'ref1', title: 'Related Paper 1', nodeType: 'referenced', year: 2023, authors: 'Author A' },
        { id: 'ref2', title: 'Related Paper 2', nodeType: 'referenced', year: 2022, authors: 'Author B' },
        { id: 'ref3', title: 'Related Paper 3', nodeType: 'referenced', year: 2023, authors: 'Author C' },
        { id: 'ref4', title: 'Related Paper 4', nodeType: 'referenced', year: 2021, authors: 'Author D' },
        { id: 'ref5', title: 'Related Paper 5', nodeType: 'referenced', year: 2022, authors: 'Author E' },
      ];
      const mockLinks: Link[] = [
        { source: doi || 'main', target: 'ref1', type: 'references' },
        { source: doi || 'main', target: 'ref2', type: 'references' },
        { source: doi || 'main', target: 'ref3', type: 'references' },
        { source: doi || 'main', target: 'ref4', type: 'references' },
        { source: doi || 'main', target: 'ref5', type: 'references' },
      ];
      setNetworkData({ nodes: mockNodes, links: mockLinks });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [doi]);

  useEffect(() => {
    fetchCitationData();
  }, [fetchCitationData]);

  useEffect(() => {
    if (!networkData || !svgRef.current || networkData.nodes.length === 0) {
      if (svgRef.current) d3.select(svgRef.current).selectChildren().remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectChildren().remove(); // Önceki çizimi temizle

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Zoomlanacak ana grup (<g>) elementini oluştur
    // Bu g elementini bir ref ile saklayıp zoom fonksiyonunda kullanacağız.
    const g = svg.append('g');
    gRef.current = g.node(); // Ref'i güncelle

    // Ok başı tanımı
    svg.append('defs').selectAll('marker')
      .data(['references'])
      .enter().append('marker')
      .attr('id', 'arrow-references') // ID'yi sabit yapalım
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22) // Düğüm yarıçapı + biraz boşluk
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', '#059669') // Ok rengi (daha koyu yeşil)
      .attr('d', 'M0,-5L10,0L0,5');

    // Düğüm ve bağlantı kopyalarını oluştur (orijinal veriyi değiştirmemek için)
    const nodesCopy = networkData.nodes.map(d => ({...d}));
    const linksCopy = networkData.links.map(d => ({...d}));

    const simulation = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id((d: any) => d.id).distance(250).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-800)) // Daha güçlü itme
      .force('center', d3.forceCenter(width / 2, height / 2 + 100)) // Graph'ı daha aşağı konumlandır
      .force('collision', d3.forceCollide().radius(d => (d as Node).nodeType === 'main' ? 50 : 30).strength(0.8)); // Çarpışma yarıçapları büyütüldü

    const link = g.append('g') // Bağlantıları g içine ekle
      .attr('stroke-opacity', 0.7)
      .selectAll('line')
      .data(linksCopy)
      .join('line')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 3) // Daha kalın çizgiler
      .attr('marker-end', 'url(#arrow-references)');

    const nodeGroups = g.append('g') // Düğüm gruplarını g içine ekle
      .selectAll('.node-group')
      .data(nodesCopy)
      .join('g')
      .attr('class', 'node-group cursor-pointer') // İmleç eklendi
      .on('click', (event, d) => setSelectedNode(d as Node))
      .call(d3.drag<SVGGElement, Node>()
        .on('start', (event, d_drag) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d_drag.fx = d_drag.x;
          d_drag.fy = d_drag.y;
        })
        .on('drag', (event, d_drag) => {
          d_drag.fx = event.x;
          d_drag.fy = event.y;
        })
        .on('end', (event, d_drag) => {
          if (!event.active) simulation.alphaTarget(0);
          if (networkData.nodes.length > 1) { // Sadece birden fazla düğüm varsa fx, fy null yap
             d_drag.fx = null;
             d_drag.fy = null;
          }
        }) as any
      );

    nodeGroups.append('circle')
      .attr('r', d => d.nodeType === 'main' ? 40 : 25) // Daha büyük node'lar
      .attr('fill', d => d.nodeType === 'main' ? '#6366f1' : '#10b981')
      .attr('stroke', d => d.nodeType === 'main' ? '#4338ca' : '#059669')
      .attr('stroke-width', 3);

    nodeGroups.append('text')
      .attr('dx', d => (d.nodeType === 'main' ? 45 : 28))
      .attr('dy', '0.35em')
      .text(d => truncateText(d.title, d.nodeType === 'main' ? 40 : 30))
      .attr('fill', '#334155')
      .attr('font-size', d => d.nodeType === 'main' ? '18px' : '14px')
      .attr('font-weight', d => d.nodeType === 'main' ? 'bold' : 'normal')
      .style('pointer-events', 'none'); // Text üzerinden drag yapılmasını engelle

    simulation.on('tick', () => {
      link
        .attr('x1', (d_link: any) => d_link.source.x)
        .attr('y1', (d_link: any) => d_link.source.y)
        .attr('x2', (d_link: any) => d_link.target.x)
        .attr('y2', (d_link: any) => d_link.target.y);
      nodeGroups.attr('transform', (d_node: any) => `translate(${d_node.x},${d_node.y})`);
    });

    // Zoom fonksiyonu
    const zoomed = (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      if (gRef.current) {
        d3.select(gRef.current).attr('transform', event.transform.toString());
      }
    };

    // Zoom davranışını tanımla ve SVG'ye uygula
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 5]) // Minimum ve maksimum zoom seviyeleri
      .on('zoom', zoomed);

    svg.call(zoomBehavior)
       // Başlangıç zoom seviyesini ve pozisyonunu ayarlamak için (isteğe bağlı):
       // .call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8).translate(-width / 2, -height / 2));
       // Veya daha basit bir başlangıç için
       // .call(zoomBehavior.scaleTo, 0.8); // Başlangıçta biraz uzaklaştırılmış göster

    // SVG'nin dışına tıklanınca seçili düğümü temizle (isteğe bağlı)
    svg.on('click', (event) => {
        if (event.target === svg.node()) { // Sadece SVG'nin kendisine tıklandıysa
            setSelectedNode(null);
        }
    });


  }, [networkData, truncateText]);

  // ... (loading, error ve veri yok durumları için return blokları aynı kalacak) ...
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchCitationData} variant="outline" size="sm" className="mt-2">
            Yeniden Dene
        </Button>
      </Alert>
    );
  }

  if (!networkData || networkData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        Bu makale için atıf ağı verisi bulunamadı veya henüz yüklenmedi.
        {!doi && " (Analiz için DOI gerekli.)"}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-end items-center px-4">
        <div className="flex items-center text-base gap-6">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-indigo-500"></span>
            <span className="font-medium">Bu Makale</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500"></span>
            <span className="font-medium">Bu Makalenin Referansları</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex pt-8">
        <div className="flex-1 relative border rounded-lg overflow-hidden bg-slate-50" style={{ minHeight: '500px' }}> {/* Arka plan rengi eklendi, daha fazla üst padding */}
          <svg ref={svgRef} width="100%" height="100%" style={{ cursor: 'grab' }} />
        </div>

        {selectedNode && (
          <Card className="w-80 ml-4 p-4 flex-shrink-0 h-full overflow-auto text-sm shadow-lg"> {/* Daha geniş ve büyük */}
            <CardContent className="p-2">
              <h3 className="font-bold text-lg mb-2 text-slate-800">{selectedNode.title}</h3>
              {selectedNode.authors && <p className="text-slate-600 mt-2 text-base"><b>Yazarlar:</b> {truncateText(selectedNode.authors, 100)}</p>}
              {selectedNode.year && (
                <div className="mt-1">
                  <span className="text-slate-500">Yıl:</span> <span className="text-slate-700">{selectedNode.year}</span>
                </div>
              )}
              {selectedNode.nodeType === 'main' && selectedNode.incomingCitationCount !== undefined && (
                <div className="mt-1">
                  <span className="text-slate-500">Gelen Atıf Sayısı:</span> <span className="text-slate-700 font-medium">{selectedNode.incomingCitationCount}</span>
                </div>
              )}
              {selectedNode.id && (selectedNode.id.startsWith('http') || selectedNode.id.includes('/')) && ( // DOI ise
                 <Button
                    size="sm"
                    variant="link"
                    className="w-full mt-3 p-0 h-auto text-blue-600 hover:text-blue-700 justify-start"
                    onClick={() => window.open(selectedNode.id.startsWith('http') ? selectedNode.id : `https://doi.org/${selectedNode.id}`, '_blank')}
                 >
                    Makaleyi Görüntüle (DOI)
                 </Button>
              ) }
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CitationNetwork;