import React from "react";
import { TopBar } from "./TopBar";
import { Grid } from "./Grid";
import StatCard from "../ui/StatCard";

export const Dashboard = () => {
  return (
   <div className="h-full bg-stone-50">
        
       <TopBar/>
       <Grid/>
    </div>
  );
};
