"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export default function StatsPage() {
  const postsPerGroupRef = useRef(null);
  const postsByMediaTypeRef = useRef(null);

  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // צבעי האתר לגרפים
  const chartBarColor = "#6f4e37";
  const chartTextColor = "#3b2f2f";
  const chartAxisTextColor = "#5f4b4b";
  const chartAxisLineColor = "#8a7474";

  // טעינת נתוני סטטיסטיקות מהשרת
  const loadStats = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      const response = await fetch("http://localhost:5000/api/stats");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch statistics");
        return;
      }

      setStats(data);
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  // טעינה ראשונית של הנתונים
  useEffect(() => {
    loadStats();
  }, []);

  // ציור הגרפים אחרי שהנתונים נטענו
  useEffect(() => {
    if (!stats) {
      return;
    }

    drawPostsPerGroupChart(stats.postsPerGroup || []);
    drawPostsByMediaTypeChart(stats.postsByMediaType || []);
  }, [stats]);

  // עיצוב צירים משותף
  const styleAxis = (axisGroup) => {
    axisGroup.selectAll("path").attr("stroke", chartAxisLineColor);
    axisGroup.selectAll("line").attr("stroke", chartAxisLineColor);

    axisGroup
      .selectAll("text")
      .attr("fill", chartAxisTextColor)
      .style("font-weight", "600");
  };

  // גרף מספר פוסטים לפי קבוצה
  const drawPostsPerGroupChart = (data) => {
    const svgElement = d3.select(postsPerGroupRef.current);
    svgElement.selectAll("*").remove();

    const width = 720;
    const height = 360;
    const margin = {
      top: 30,
      right: 30,
      bottom: 100,
      left: 60,
    };

    const svg = svgElement
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "w-full h-auto");

    const x = d3
      .scaleBand()
      .domain(data.map((item) => item.groupName))
      .range([margin.left, width - margin.right])
      .padding(0.25);

    const maxValue = d3.max(data, (item) => item.postsCount) || 1;

    const y = d3
      .scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // ציר X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(styleAxis)
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", chartAxisTextColor)
      .style("font-weight", "600");

    // ציר Y
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(styleAxis);

    // עמודות
    svg
      .selectAll(".group-bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "group-bar")
      .attr("x", (item) => x(item.groupName))
      .attr("y", (item) => y(item.postsCount))
      .attr("width", x.bandwidth())
      .attr("height", (item) => height - margin.bottom - y(item.postsCount))
      .attr("rx", 8)
      .attr("fill", chartBarColor);

    // מספרים מעל העמודות
    svg
      .selectAll(".group-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "group-label")
      .attr("x", (item) => x(item.groupName) + x.bandwidth() / 2)
      .attr("y", (item) => y(item.postsCount) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .style("fill", chartTextColor)
      .text((item) => item.postsCount);
  };

  // גרף פוסטים לפי סוג מדיה
  const drawPostsByMediaTypeChart = (data) => {
    const svgElement = d3.select(postsByMediaTypeRef.current);
    svgElement.selectAll("*").remove();

    const width = 720;
    const height = 320;
    const margin = {
      top: 30,
      right: 30,
      bottom: 60,
      left: 60,
    };

    const svg = svgElement
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "w-full h-auto");

    const x = d3
      .scaleBand()
      .domain(data.map((item) => item.type))
      .range([margin.left, width - margin.right])
      .padding(0.35);

    const maxValue = d3.max(data, (item) => item.count) || 1;

    const y = d3
      .scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // ציר X
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .call(styleAxis)
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", chartAxisTextColor)
      .style("font-weight", "600");

    // ציר Y
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .call(styleAxis);

    // עמודות
    svg
      .selectAll(".media-bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "media-bar")
      .attr("x", (item) => x(item.type))
      .attr("y", (item) => y(item.count))
      .attr("width", x.bandwidth())
      .attr("height", (item) => height - margin.bottom - y(item.count))
      .attr("rx", 8)
      .attr("fill", chartBarColor);

    // מספרים מעל העמודות
    svg
      .selectAll(".media-label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "media-label")
      .attr("x", (item) => x(item.type) + x.bandwidth() / 2)
      .attr("y", (item) => y(item.count) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .style("fill", chartTextColor)
      .text((item) => item.count);
  };

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-[#eadfd4] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="book-title-shadow book-font text-4xl font-bold text-[#3b2f2f]">
                Statistics Dashboard
              </h1>

              <p className="mt-3 text-[#5f4b4b]">
                Dynamic statistics from the BookConnect database, displayed
                with D3.js.
              </p>
            </div>

            <button
              type="button"
              onClick={loadStats}
              className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white transition hover:bg-[#5a3f2d]"
            >
              Refresh Data
            </button>
          </div>

          {isLoading && (
            <p className="mt-6 text-[#5f4b4b]">Loading statistics...</p>
          )}

          {message && (
            <p className="mt-6 rounded-xl border border-[#eadfd4] bg-[#f8f3ed] px-4 py-3 text-[#5f4b4b]">
              {message}
            </p>
          )}

          {!isLoading && stats && (
            <div className="mt-8 space-y-8">
              <div className="rounded-2xl border border-[#eadfd4] bg-[#fffaf5] p-5">
                <h2 className="text-2xl font-bold text-[#3b2f2f]">
                  Posts per Group
                </h2>

                <p className="mt-2 text-sm text-[#5f4b4b]">
                  Shows how many posts exist in each group.
                </p>

                <div className="mt-5 overflow-x-auto rounded-xl bg-white p-4">
                  <svg ref={postsPerGroupRef}></svg>
                </div>
              </div>

              <div className="rounded-2xl border border-[#eadfd4] bg-[#fffaf5] p-5">
                <h2 className="text-2xl font-bold text-[#3b2f2f]">
                  Posts by Media Type
                </h2>

                <p className="mt-2 text-sm text-[#5f4b4b]">
                  Shows how many posts are text-only, image posts, or video
                  posts.
                </p>

                <div className="mt-5 overflow-x-auto rounded-xl bg-white p-4">
                  <svg ref={postsByMediaTypeRef}></svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}