"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import MapComponent from "@/components/MapComponent"; 
import SDGSlider from "@/components/SDGSlider";
import LeadershipScroll from '@/components/LeadershipScroll';
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

 //NOTE 
//all datas are here - arranged as per what data json will render
// just need to useEffect , fetch post request , get the "data" which will have these values prefilled

const data= {
  "metrics": [
      {
          "p_e_ratio": "37.29",
          "p_b_ratio": "61.37",
          "debt_to_equity_ratio": "1.87",
          "free_cashflow": "$7.09 billion",
          "peg_ratio": "-45.94",
          "working_capital_ratio": "0.87",
          "quick_ratio": "0.83",
          "earning_ratio": "0.24",
          "return_on_equity": "164.59%",
          "esg_score": "Reflects recent developments and challenges"
      }
  ],
  "revenue": [
      {
          "revenue_source": "iPhone",
          "revenue_value": 205486000000
      },
      {
          "revenue_source": "Mac",
          "revenue_value": 40525000000
      },
      {
          "revenue_source": "iPad",
          "revenue_value": 29956000000
      },
      {
          "revenue_source": "Wearables, Home and Accessories",
          "revenue_value": 49900000000
      },
      {
          "revenue_source": "Services",
          "revenue_value": 81234000000
      }
  ],
  "countries": [
      {
          "country": "United States of America",
          "market_percentage": "45%"
      },
      {
          "country": "China",
          "market_percentage": "25%"
      },
      {
          "country": "Germany",
          "market_percentage": "10%"
      },
      {
          "country": "United Kingdom",
          "market_percentage": "8%"
      },
      {
          "country": "India",
          "market_percentage": "7%"
      },
      {
          "country": "Japan",
          "market_percentage": "5%"
      }
  ],
  "team": [
      {
          "name": "Tim Cook",
          "designation": "Chief Executive Officer",
          "vision_for_company": "To maintain Apple's legacy of innovation, sustainability, and excellence, while expanding the company's product lines and services into new markets."
      },
      {
          "name": "Luca Maestri",
          "designation": "Chief Financial Officer",
          "vision_for_company": "To ensure Apple's financial strength and stability, investing in strategic growth initiatives and maintaining operational efficiency."
      },
      {
          "name": "Jeff Williams",
          "designation": "Chief Operating Officer",
          "vision_for_company": "To optimize Apple's operations, supply chain, and product quality, ensuring seamless integration and innovation across all departments."
      }
  ],
  "goals": [
      {
          "sdg_number": "3",
          "goal_description": "Good Health and Well-being",
          "contribution": "Apple contributes to SDG 3 by integrating health tracking and wellness features into its devices, thereby promoting healthier lifestyles and providing users with tools to monitor their health."
      },
      {
          "sdg_number": "4",
          "goal_description": "Quality Education",
          "contribution": "The company supports SDG 4 by providing educational tools and resources through technology, helping educational institutions enhance learning through iPads and various educational apps."
      },
      {
          "sdg_number": "7",
          "goal_description": "Affordable and Clean Energy",
          "contribution": "Apple is working towards SDG 7 by committing to use 100% renewable energy in its facilities, as well as encouraging its suppliers to adopt clean energy in their operations."
      },
      {
          "sdg_number": "9",
          "goal_description": "Industry, Innovation and Infrastructure",
          "contribution": "Apple supports SDG 9 through continuous technological advancements and innovations that contribute to building resilient infrastructure and fostering industry growth."
      },
      {
          "sdg_number": "10",
          "goal_description": "Reduced Inequalities",
          "contribution": "By ensuring diverse and inclusive practices within its workforce and promoting diversity in the tech industry, Apple contributes to reducing inequalities."
      },
      {
          "sdg_number": "17",
          "goal_description": "Partnerships for the Goals",
          "contribution": "Apple collaborates with governments, NGOs, and other corporations to address global issues such as climate change and sustainable development, supporting SDG 17."
      }
  ]
}
  //additional datas for graph and headers and stuffs

  const tableColumns = ['Revenue Sources', 'Net Revenue'];

  // const barChartData = {
  //   labels: data.stakeholders.map(item => item.stakeholder_name),
  //   datasets: [
  //     {
  //       label: 'Shares',
  //       data: data.stakeholders.map(item => item.stakeholder_stocks_value),
  //       backgroundColor: 'rgba(54, 162, 235, 0.6)',
  //     },
  //     {
  //       label: 'Percentage',
  //       data: data.stakeholders.map(item => item.stakeholder_equity),
  //       backgroundColor: 'rgba(75, 192, 192, 0.6)',
  //     },
  //   ],
  // };  

  const barChartData = {
    labels: data.revenue.map(item => item.revenue_source),
    datasets: [
      {
        label: 'Shares',
        data: data.revenue.map(item =>
          Number(item.revenue_value) // Remove commas and convert to number
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };
  
  
  

 


const DashboardPage: React.FC = () => {


  const [data, setData] = useState<any>(null); // State to store the fetched data
    const tableColumns = ['Revenue Sources', 'Net Revenue']; // Columns for the table

    useEffect(() => {
        const fetchData = async () => {
            try {
              const response = await fetch('/api/report');
                
                // Replace with actual path
                if (!response.ok) {
                    throw new Error(`Error fetching data: ${response.statusText}`);
                }

                const jsonData = await response.json(); // Parse the JSON data
                setData(jsonData); // Update state with the fetched data
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };

        fetchData(); // Fetch data when the component mounts
    }, []); // Empty dependency array ensures this runs once

    if (!data) {
        return <div>Loading...</div>; // Display loading state while fetching
    }

    const barChartData = {
        labels: data.revenue.map((item: any) => item.revenue_source), // Dynamic labels
        datasets: [
            {
                label: 'Net Revenue',
                data: data.revenue.map((item: any) => Number(item.revenue_value)), // Dynamic data
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            },
        ],
    };






  return (
    <div className='bg-black min-h-screen w-screen text-white pl-10 pr-10 max-w-[100vw] overflow-x:hidden'>  
    <div className="flex items-center h-12 px-7 border-b border-neutral-800 ml-2">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
    </div>
    

    
    
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
      <CardContainer className="w-full">
  <CardBody className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/[0.1] hover:border-zinc-700">
    <CardItem
      translateZ="50"
      className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
    >
      Key Metrics
    </CardItem>
    <CardItem
      as="p"
      translateZ="60"
      className="text-zinc-400 text-sm mt-2 mb-3"
    >
      Overview of important financial metrics
    </CardItem>
    <div className=" overflow-x-auto max-h-[250px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-3 text-sm text-emerald-400 font-medium border-b border-zinc-800 sticky top-0 bg-zinc-900">
              Metric
            </th>
            <th className="text-left p-3 text-sm text-emerald-400 font-medium border-b border-zinc-800 sticky top-0 bg-zinc-900">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.metrics[0]).map(([key, value], index) => (
            <tr
              key={index}
              className="border-b text-sm border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
            >
              <td className="p-3 text-zinc-300">
                {key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
              </td>
              <td className="p-3 text-zinc-300 font-mono">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </CardBody>
</CardContainer>

            {/* Charts Grid */}
            
              {/* Capitalization Table */}
  <CardContainer className="w-full">
  <CardBody className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/[0.1] hover:border-zinc-700">
    <CardItem
      translateZ="50"
      className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
    >
      Revenue Sources
    </CardItem>
    <CardItem
      as="p"
      translateZ="60"
      className="text-zinc-400 text-sm mt-2 mb-3"
    >
      A breakdown of revenue sources.
    </CardItem>
    <div className="overflow-x-auto mr-3 max-h-[250px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
      <table className="w-full">
        <thead>
          <tr>
            {tableColumns.map((col) => (
              <th 
                key={col} 
                className="text-left p-3 text-sm text-emerald-400 font-medium border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur-sm"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.revenue.map((item, index) => (
            <tr 
              key={index} 
              className="border-b text-sm border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
            >
              <td className="p-3 text-zinc-300">{item.revenue_source}</td>
              <td className="p-3 text-zinc-300 font-mono">{item.revenue_value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </CardBody>
</CardContainer>

              {/* Bar Chart */}
              <CardContainer className="w-full">
                <CardBody className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/[0.1] hover:border-zinc-700">
                  {/* <CardItem
                    translateZ="50"
                    className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
                  >
                    Shareholder Distribution
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-zinc-400 text-sm mt-2 mb-6"
                  >
                    A bar chart showing the shares and percentage distribution.
                  </CardItem> */}
                  <div className="h-[350px]">
                    <Bar
                      data={{
                        ...barChartData,
                        datasets: barChartData.datasets.map(dataset => ({
                          ...dataset,
                          backgroundColor: dataset.backgroundColor || 'rgb(52, 211, 153)',
                          borderColor: dataset.borderColor || 'rgb(16, 185, 129)',
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: {
                              color: '#d4d4d8'
                            }
                          },
                          title: {
                            display: true,
                            text: 'Shareholder Distribution',
                            color: '#d4d4d8',
                            font: {
                              size: 14
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgb(24 24 27 / 0.9)',
                            titleColor: '#d4d4d8',
                            bodyColor: '#d4d4d8',
                            callbacks: {
                              label: (tooltipItem) => {
                                if (tooltipItem.datasetIndex === 0) {
                                  return `Shares: ${tooltipItem.raw.toLocaleString()}`;
                                }
                                return `Percentage: ${tooltipItem.raw}%`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: 'rgb(39 39 42 / 0.5)'
                            },
                            ticks: {
                              color: '#a1a1aa'
                            },
                            title: {
                              display: true,
                              text: 'Amount / Percentage',
                              color: '#a1a1aa'
                            }
                          },
                          x: {
                            grid: {
                              color: 'rgb(39 39 42 / 0.5)'
                            },
                            ticks: {
                              color: '#a1a1aa'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </CardBody>
              </CardContainer>
            </div>
          
<div className="min-h-auto flex flex-col p-1 overflow-hidden">
  <h1 className="text-2xl font-bold ml-3 mb-1">Market Penetration Map</h1>
  
  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1 overflow-hidden relative max-w-[100%]">
    <div className="md:col-span-2 max-h-[70vh] max-w-[60%] rounded-xl overflow-hidden bg-gray-100 m-0 p-0">
      <MapComponent countries={data.countries}/>
    </div>
    <div className="ml-1 pl-2">
      <LeadershipScroll team={data.team} />
    </div>
</div>
</div >
<div className="bg-black pb-0">
            <SDGSlider sdg={data.goals} />
          </div>

</div>





    
    
  
  );
};




export default DashboardPage;
