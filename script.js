// Load and process the CSV data
let globalData = [];

// Teams to look for
const teams = ['India', 'England', 'Australia', 'Pakistan', 'South Africa', 'West Indies', 
               'New Zealand', 'Sri Lanka', 'Bangladesh', 'Zimbabwe', 'Afghanistan', 'Ireland', 
               'Netherlands', 'Scotland', 'Canada'];

// Famous cricket players to look for
const players = ['Sachin Tendulkar', 'Virat Kohli', 'MS Dhoni', 'Rohit Sharma', 'Steve Smith', 
                 'David Warner', 'Joe Root', 'Ben Stokes', 'Kane Williamson', 'Babar Azam',
                 'AB de Villiers', 'Chris Gayle', 'Brian Lara', 'Ricky Ponting', 'Shane Warne',
                 'Glenn McGrath', 'James Anderson', 'Jasprit Bumrah', 'Mitchell Starc', 'Pat Cummins',
                  'Muttiah Muralitharan', 'Lasith Malinga', 'Jacques Kallis', 'Yuvraj Singh', 'Kapil Dev', 
                  'Anil Kumble', 'Sunil Gavaskar', 'Rahul Dravid', 'Sourav Ganguly', 'Adam Gilchrist', 'Michael Clarke', 
                  'Dale Steyn', 'Trent Boult', 'Faf du Plessis', 'Shakib Al Hasan', 'Tamim Iqbal', 'Shahid Afridi'];

// Cricket terms to analyze
const cricketTerms = ['bat', 'ball', 'wicket', 'run', 'over', 'bowl', 'catch', 'stump', 'innings', 'bowling',
                      'century', 'fifty', 'six', 'four', 'boundary', 'spinner', 'fast bowler',
                      'test', 'odi', 't20', 'match', 'series', 'tournament', 'world cup', 'umpire',
                      'pitch', 'field', 'sixer', 'bowler', 'batsman', 'all-rounder', 'duck', 'maiden',
                      'run rate', 'strike rate', 'powerplay', 'super over', 'no ball', 'wide ball', 'leg bye', 
                      'byes', 'LBW', 'googly', 'yorker', 'bouncer', 'run out', 'stumping', 'cover drive', 
                      'pull shot', 'sweep shot', 'drive', 'cut shot'];

// Color palette
const colors = ['#377bc8', '#af1e1e', '#c2ba21', '#28c700', '#00672e', '#520505', '#575151', 
                '#002aff', '#054e15', '#f82e2e', '#2d13bd', '#0ab919', '#ff9500',
                '#5a00cf', '#d6a801'];

// Load CSV data
d3.csv('newopenorca_cricket_regex_2_300.csv').then(data => {
    globalData = data;
    console.log(`Loaded ${data.length} questions`);
    
    // Create all visualizations
    createTeamNetwork(data);
    createPlayerChart(data);
    createQuestionTypesChart(data);
    createWordCloud(data);
    createStatsChart(data);
    createComplexityChart(data);
}).catch(error => {
    console.error('Error loading CSV:', error);
    // Show error messages in each visualization
    d3.selectAll('.visualization').html('<p class="loading">Error loading data. Please ensure the CSV file is in the same directory.</p>');
});

// Visualization 1: Team Co-occurrence Network
function createTeamNetwork(data) {
    const container = d3.select('#network-viz');
    container.html('');
    
    const width = container.node().getBoundingClientRect().width;
    const height = 650;
    
    // Find team co-occurrences
    const teamCounts = {};
    const cooccurrences = {};
    
    teams.forEach(team => {
        teamCounts[team] = 0;
        cooccurrences[team] = {};
        teams.forEach(otherTeam => {
            if (team !== otherTeam) {
                cooccurrences[team][otherTeam] = 0;
            }
        });
    });
    
    data.forEach(row => {
        const text = (row.question || '').toLowerCase();
        const foundTeams = teams.filter(team => text.includes(team.toLowerCase()));
        
        foundTeams.forEach(team => {
            teamCounts[team]++;
            foundTeams.forEach(otherTeam => {
                if (team !== otherTeam) {
                    cooccurrences[team][otherTeam]++;
                }
            });
        });
    });
    
    // Create nodes and links
    const nodes = teams
        .filter(team => teamCounts[team] > 0)
        .map(team => ({
            id: team,
            count: teamCounts[team]
        }));
    
    const links = [];
    nodes.forEach(source => {
        nodes.forEach(target => {
            if (source.id < target.id) {
                const weight = cooccurrences[source.id][target.id];
                if (weight > 0) {
                    links.push({
                        source: source.id,
                        target: target.id,
                        value: weight
                    });
                }
            }
        });
    });
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(d => 250 - d.value * 5))
        .force('charge', d3.forceManyBody().strength(-800))
        .force('center', d3.forceCenter(width / 2, height / 2 - 30))
        .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.count) * 3 + 30));
    
    // Create links
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('class', 'link')
        .attr('stroke-width', d => Math.sqrt(d.value) * 2)
        .style('stroke', '#8ef9ff')
        .style('stroke-opacity', 0.7);
    
    // Create nodes
    const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
    
    node.append('circle')
        .attr('r', d => Math.sqrt(d.count) * 3 + 10)
        .style('fill', (d, i) => colors[i % colors.length])
        .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`<strong>${d.id}</strong><br/>Mentions: ${d.count}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
        });
    
    node.append('text')
        .text(d => d.id)
        .attr('x', 0)
        .attr('y', 4)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#ffffff')
        .style('pointer-events', 'none');
    
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    // Add legend
    d3.select('#network-legend')
        .html('<p><strong>Tip:</strong> Drag nodes to explore connections. Node size = total mentions, Link thickness = co-mentions</p>');
}

// Visualization 2: Most Popular Cricket Players
function createPlayerChart(data) {
    const container = d3.select('#players-viz');
    container.html('');
    
    const width = container.node().getBoundingClientRect().width;
    const height = 600;
    const margin = { top: 20, right: 80, bottom: 60, left: 200 };
    
    // Count player mentions
    const playerCounts = {};
    players.forEach(player => playerCounts[player] = 0);
    
    data.forEach(row => {
        const text = row.question || '';
        players.forEach(player => {
            if (text.toLowerCase().includes(player.toLowerCase())) {
                playerCounts[player]++;
            }
        });
    });
    
    // Sort and get top 15
    const sortedPlayers = Object.entries(playerCounts)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const chart = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(sortedPlayers, d => d[1])])
        .range([0, chartWidth]);
    
    const yScale = d3.scaleBand()
        .domain(sortedPlayers.map(d => d[0]))
        .range([0, chartHeight])
        .padding(0.2);
    
    // Bars
    chart.selectAll('.bar')
        .data(sortedPlayers)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .attr('y', d => yScale(d[0]))
        .attr('width', d => xScale(d[1]))
        .attr('height', yScale.bandwidth())
        .attr('fill', (d, i) => colors[i % colors.length])
        .attr('rx', 4)
        .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`<strong>${d[0]}</strong><br/>Mentions: ${d[1]}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
        });
    
    // Value labels
    chart.selectAll('.bar-label')
        .data(sortedPlayers)
        .join('text')
        .attr('class', 'bar-label')
        .attr('x', d => xScale(d[1]) + 5)
        .attr('y', d => yScale(d[0]) + yScale.bandwidth() / 2 + 4)
        .text(d => d[1])
        .style('font-weight', 'bold')
        .style('fill', '#00ffff');
    
    // Y axis
    chart.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', '12px');
    
    // X axis
    chart.append('g')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', chartWidth / 2)
        .attr('y', 40)
        .attr('fill', '#48dbfb')
        .style('text-anchor', 'middle')
        .text('Number of Mentions');
}

// Visualization 3: Question Types Distribution
function createQuestionTypesChart(data) {
    const container = d3.select('#types-viz');
    container.html('');
    
    const width = Math.min(container.node().getBoundingClientRect().width, 600);
    const height = 600;
    const radius = Math.min(width, height) / 2 - 60;
    
    // Categorize questions
    const categories = {
        'Multiple Choice': 0,
        'How-to/Instructional': 0,
        'Translation': 0,
        'Summarization': 0,
        'Factual/Who-What-When': 0,
        'Opinion/Analysis': 0,
        'Other': 0
    };
    
    data.forEach(row => {
        const q = (row.question || '').toLowerCase();
        if (q.includes('select from') || q.includes('choose from') || q.includes('options')) {
            categories['Multiple Choice']++;
        } else if (q.includes('how to') || q.includes('how do') || q.includes('steps')) {
            categories['How-to/Instructional']++;
        } else if (q.includes('translate') || q.includes('spanish') || q.includes('french')) {
            categories['Translation']++;
        } else if (q.includes('summarize') || q.includes('summary')) {
            categories['Summarization']++;
        } else if (q.includes('who') || q.includes('what') || q.includes('when') || q.includes('where')) {
            categories['Factual/Who-What-When']++;
        } else if (q.includes('why') || q.includes('explain') || q.includes('analyze')) {
            categories['Opinion/Analysis']++;
        } else {
            categories['Other']++;
        }
    });
    
    const pieData = Object.entries(categories)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({ category: key, value: value }));
    
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);
    
    const arcs = g.selectAll('.arc')
        .data(pie(pieData))
        .join('g')
        .attr('class', 'arc');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => colors[i % colors.length])
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .on('mouseover', (event, d) => {
            const percent = ((d.data.value / data.length) * 100).toFixed(2);
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`<strong>${d.data.category}</strong><br/>Count: ${d.data.value}<br/>Percentage: ${percent}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
        });
    
    // Add percentage labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .text(d => {
            const percent = ((d.data.value / data.length) * 100).toFixed(2);
            return `${percent}%`;
        });
    
    // Add center text
    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', -10)
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', '#667eea')
        .text(data.length);
    
    g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 15)
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Total Questions');
    
    // Legend at bottom
    const legend = svg.append('g')
        .attr('transform', `translate(20, ${height - (pieData.length * 20 + 20)})`);
    
    pieData.forEach((d, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        legendRow.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', colors[i % colors.length])
            .attr('rx', 2);
        
        legendRow.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .style('font-size', '11px')
            .style('fill', '#e0e0e0')
            .text(d.category);
    });
}

// Visualization 4: Most Common Cricket Terms (Word Cloud)
function createWordCloud(data) {
    const container = d3.select('#terms-viz');
    container.html('');
    
    const width = container.node().getBoundingClientRect().width;
    const height = 600;
    
    // Count cricket term frequencies
    const termCounts = {};
    cricketTerms.forEach(term => termCounts[term] = 0);
    
    data.forEach(row => {
        const text = (row.question || '').toLowerCase();
        cricketTerms.forEach(term => {
            const regex = new RegExp('\\b' + term + '\\b', 'gi');
            const matches = text.match(regex);
            if (matches) {
                termCounts[term] += matches.length;
            }
        });
    });
    
    const words = Object.entries(termCounts)
        .filter(([_, count]) => count > 0)
        .map(([word, count]) => ({ text: word, size: count }));
    
    const maxSize = d3.max(words, d => d.size);
    const minSize = d3.min(words, d => d.size);
    
    const sizeScale = d3.scaleLinear()
        .domain([minSize, maxSize])
        .range([20, 80]);
    
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    const layout = d3.layout.cloud()
        .size([width - 80, height - 80])
        .words(words)
        .padding(8)
        .rotate(() => (0))
        .font('Arial, sans-serif')
        .fontSize(d => sizeScale(d.size))
        .on('end', draw);
    
    layout.start();
    
    function draw(words) {
        const g = svg.append('g')
            .attr('class', 'word-cloud')
            .attr('transform', `translate(${width / 2},${height / 2})`);
        
        // Define high-contrast color gradient for words
        const colorGradient = ['#f5f7ff', '#bfefff', '#7df9ff', '#ff8ef7', '#ffd3ff', '#9dffea', '#a7b6ff', '#7de580', '#ffb3d9','#ffe680'];
        
        g.selectAll('text')
            .data(words)
            .join('text')
            .style('font-size', d => d.size + 'px')
            .style('font-family', 'Arial, sans-serif')
            .style('font-weight', '600')
            .style('fill', (d, i) => colorGradient[i % colorGradient.length])
            .style('text-shadow', '0 0 8px rgba(0, 255, 255, 0.35), 0 0 4px rgba(0, 0, 0, 0.9)')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
            .text(d => d.text)
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .transition().duration(200)
                    .style('font-size', (parseFloat(d3.select(event.target).style('font-size')) * 1.2) + 'px');
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(`<strong>${d.text}</strong><br/>Count: ${termCounts[d.text]}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', (event, d) => {
                d3.select(event.target)
                    .transition().duration(200)
                    .style('font-size', d.size + 'px');
                tooltip.transition().duration(500).style('opacity', 0);
            });
    }
}

// Visualization 5: Statistical vs Descriptive Questions
function createStatsChart(data) {
    const container = d3.select('#stats-viz');
    container.html('');
    
    const width = Math.min(container.node().getBoundingClientRect().width, 600);
    const height = 600;
    const radius = Math.min(width, height) / 2 - 60;
    
    // Count questions with numbers
    let withNumbers = 0;
    let withoutNumbers = 0;
    
    data.forEach(row => {
        const text = row.question || '';
        if (/\d/.test(text)) {
            withNumbers++;
        } else {
            withoutNumbers++;
        }
    });
    
    const pieData = [
        { category: 'With Numbers/Statistics', value: withNumbers },
        { category: 'Without Numbers', value: withoutNumbers }
    ];
    
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    const labelArc = d3.arc()
        .innerRadius(radius * 0.7)
        .outerRadius(radius * 0.7);
    
    const arcs = g.selectAll('.arc')
        .data(pie(pieData))
        .join('g')
        .attr('class', 'arc');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => [colors[0], colors[3]][i])
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .on('mouseover', (event, d) => {
            const percent = ((d.data.value / data.length) * 100).toFixed(1);
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`<strong>${d.data.category}</strong><br/>Count: ${d.data.value}<br/>Percentage: ${percent}%`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
        });
    
    // Add labels with both count and percentage
    arcs.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', 'white')
        .style('text-shadow', '0 0 5px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.5)')
        .each(function(d) {
            const percent = ((d.data.value / data.length) * 100).toFixed(1);
            const text = d3.select(this);
            text.append('tspan')
                .attr('x', 0)
                .attr('dy', '-0.3em')
                .text(`${d.data.value}`);
            text.append('tspan')
                .attr('x', 0)
                .attr('dy', '1.2em')
                .style('font-size', '16px')
                .text(`(${percent}%)`);
        });
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(20, ${height - 80})`);
    
    pieData.forEach((d, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendRow.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', [colors[0], colors[3]][i])
            .attr('rx', 3);
        
        legendRow.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .style('font-size', '13px')
            .style('fill', '#e0e0e0')
            .text(d.category);
    });
}

// Visualization 6: Question Complexity Distribution (Histogram)
function createComplexityChart(data) {
    const container = d3.select('#complexity-viz');
    container.html('');
    
    const width = container.node().getBoundingClientRect().width - 50;
    const height = 600;
    const margin = { top: 20, right: 40, bottom: 70, left: 70 };
    
    // Count words in each question
    const wordCounts = data.map(row => {
        const words = (row.question || '').trim().split(/\s+/);
        return words.length;
    });
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const chart = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Create histogram bins
    const maxWords = d3.max(wordCounts);
    const histogram = d3.histogram()
        .domain([0, maxWords + 5])
        .thresholds(25);
    
    const bins = histogram(wordCounts);
    
    // Scales with proper padding
    const xScale = d3.scaleLinear()
        .domain([0, maxWords + 5])
        .range([0, chartWidth])
        .nice();
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([chartHeight, 0]);
    
    // Bars
    chart.selectAll('.histogram-bar')
        .data(bins)
        .join('rect')
        .attr('class', 'histogram-bar')
        .attr('x', d => xScale(d.x0) + 1)
        .attr('y', d => yScale(d.length))
        .attr('width', d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 2))
        .attr('height', d => chartHeight - yScale(d.length))
        .attr('fill', colors[0])
        .attr('rx', 3)
        .on('mouseover', (event, d) => {
            tooltip.transition().duration(200).style('opacity', .9);
            tooltip.html(`<strong>Word Count: ${Math.round(d.x0)}-${Math.round(d.x1)}</strong><br/>Questions: ${d.length}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => {
            tooltip.transition().duration(500).style('opacity', 0);
        });
    
    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(10);
    chart.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(xAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', chartWidth / 2)
        .attr('y', 50)
        .attr('fill', '#48dbfb')
        .style('text-anchor', 'middle')
        .text('Number of Words in Question');
    
    // Y axis
    const yAxis = d3.axisLeft(yScale).ticks(10);
    chart.append('g')
        .attr('class', 'axis')
        .call(yAxis)
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -chartHeight / 2)
        .attr('y', -55)
        .attr('fill', '#48dbfb')
        .style('text-anchor', 'middle')
        .text('Number of Questions');
    
    // Add statistics text
    const mean = d3.mean(wordCounts).toFixed(1);
    const median = d3.median(wordCounts).toFixed(1);
    
    const stats = chart.append('g')
        .attr('transform', `translate(${chartWidth - 150}, 20)`);
    
    stats.append('rect')
        .attr('width', 140)
        .attr('height', 60)
        .attr('fill', 'rgba(30, 30, 60, 0.8)')
        .attr('stroke', '#ff00ff')
        .attr('stroke-width', 1.5)
        .attr('rx', 5);
    
    stats.append('text')
        .attr('x', 10)
        .attr('y', 15)
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .style('fill', '#00ffff')
        .text('Statistics:');
    
    stats.append('text')
        .attr('x', 10)
        .attr('y', 35)
        .style('font-size', '12px')
        .style('fill', '#e0e0e0')
        .text(`Mean: ${mean} words`);
    
    stats.append('text')
        .attr('x', 10)
        .attr('y', 50)
        .style('font-size', '12px')
        .style('fill', '#e0e0e0')
        .text(`Median: ${median} words`);
}

// Smooth scroll for navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
