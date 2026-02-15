import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-pink-50 to-pink-100 flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      {/* Decorative SVG blob background */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      {/* Text + CTA */}
      <div className="z-10 max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          Welcome to{" "}
          <span className="text-pink-500">PlayLiterate</span>
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-700 leading-relaxed">
          Where learning a new language feels like play.  
          Unlock confidence, <span className="text-purple-600 font-semibold">connect cultures</span>,  
          and open new opportunities — all while having fun.
        </p>

        <button
          onClick={() => navigate("/signup")}
          className="mt-6 px-8 py-3 bg-green-400 text-white rounded-full font-semibold text-lg shadow-lg hover:scale-105 hover:bg-green-500 transition-transform"
        >
          Get Started 🚀
        </button>
      </div>

      {/* Characters Image */}
      <div className="relative mt-10 z-10 w-full max-w-3xl">
        <img
          src="/characters-with-bubbles.png"
          alt="Group of characters greeting in multiple languages"
          className="w-full h-auto mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Pitch */}
      <div className="mt-12 max-w-2xl text-center z-10">
        <p className="text-lg text-gray-800 leading-relaxed">
          <span className="text-pink-500 font-bold">PlayLiterate</span> isn&apos;t just about learning{" "}
          <span className="text-purple-600 font-semibold">words</span>.  
          It&apos;s about unlocking confidence,{" "}
          <span className="text-purple-600 font-semibold">connecting cultures</span>,  
          and opening opportunities. The best part?{" "}
          <span className="text-purple-600 font-semibold">Learning</span> never feels like work —  
          <span className="text-purple-600 font-semibold"> it feels like a game</span> you&apos;ll want to come back to every day.
        </p>
      </div>
    </section>
  );
}
