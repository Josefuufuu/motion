import React from 'react'
import { DashboardHeader } from './DashboardHeader '

import { DashboardMetrics } from './DashboardMetrics'
import { QuickActions } from './QuickACtions'
import { DashboardPanels } from './DashboardBottomPanels'
export const Grid = () => {
  return (
    <div className='px-4 py-4 space-y-4"'>
        <DashboardHeader/>
        <DashboardMetrics/>
        <QuickActions/>
        <DashboardPanels/>

    </div>
  )
}
