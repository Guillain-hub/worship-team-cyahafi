"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from "@/components/ui/progress"
import { FileDown, CheckCircle2, XCircle, TrendingUp, Minus, Search, AlertCircle, Wallet, Loader2, CalendarRange, Settings2 } from 'lucide-react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useSettings } from '@/components/settings-provider'

type Member = { id: string; fullName: string }
type AttendanceRecord = { memberId: string; status: string }
type ContributionRecord = { memberId: string; amount: number }

export default function SmartReportPage() {
  // --- STATE ---
  const [reportType, setReportType] = useState<'attendance' | 'contribution' | 'both'>('attendance')
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  
  // New Flexible Controls
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7))
  const [isRangeMode, setIsRangeMode] = useState(false)
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 7))
  const { threshold, setThreshold, showValues } = useSettings()

  // Data State
  const [availableActivities, setAvailableActivities] = useState<any[]>([])
  const [availableEvents, setAvailableEvents] = useState<any[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord[]>>({})
  const [contribMap, setContribMap] = useState<Record<string, ContributionRecord[]>>({})

  // --- DATA FETCHING ---
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [aRes, eRes, mRes] = await Promise.all([
          fetch('/api/activities'), fetch('/api/contributions'), fetch('/api/members'),
        ])
        const [aJson, eJson, mJson] = await Promise.all([aRes.json(), eRes.json(), mRes.json()])
        setAvailableActivities(aJson.activities || [])
        setAvailableEvents(eJson.events?.filter((e: any) => e.name !== '_internal_usage') || [])
        setMembers(mJson.members || [])
      } catch (err) { console.error("Initial Load Error:", err) }
    }
    loadMetadata()
  }, [])

  useEffect(() => {
    const loadDetails = async () => {
      const activityIdsToFetch = selectedActivities.filter(id => !attendanceMap[id])
      const eventIdsToFetch = selectedEvents.filter(id => !contribMap[id])

      if (activityIdsToFetch.length === 0 && eventIdsToFetch.length === 0) return
      
      setIsLoadingDetails(true)
      try {
        await Promise.all([
          ...activityIdsToFetch.map(async (id) => {
            const res = await fetch(`/api/activities/${id}/attendance`)
            const json = await res.json()
            setAttendanceMap(prev => ({ ...prev, [id]: json.attendance || [] }))
          }),
          ...eventIdsToFetch.map(async (id) => {
            const res = await fetch(`/api/contributions/${id}`)
            const json = await res.json()
            const data = json.event?.contributions || json.contributions || []
            setContribMap(prev => ({ ...prev, [id]: data }))
          })
        ])
      } finally {
        setIsLoadingDetails(false)
      }
    }
    loadDetails()
  }, [selectedActivities, selectedEvents, attendanceMap, contribMap])

  // --- LOGIC & MEMOS ---
  const filteredActivities = useMemo(() => {
    return availableActivities.filter(a => {
      if (!isRangeMode) return a.date?.startsWith(selectedMonth)
      return a.date >= selectedMonth && a.date <= endDate
    })
  }, [availableActivities, selectedMonth, endDate, isRangeMode])

  const filteredEvents = useMemo(() => {
    return availableEvents.filter(e => {
      if (!isRangeMode) return e.date?.startsWith(selectedMonth)
      return e.date >= selectedMonth && e.date <= endDate
    })
  }, [availableEvents, selectedMonth, endDate, isRangeMode])

  const filteredMembers = useMemo(() => 
    members.filter(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase())), 
    [members, searchQuery]
  )

  const memoizedIndexes = useMemo(() => {
    const indexedAttendance: Record<string, Record<string, string>> = {}
    const indexedContribs: Record<string, Record<string, number>> = {}
    Object.entries(attendanceMap).forEach(([actId, records]) => {
      indexedAttendance[actId] = Object.fromEntries(records.map(r => [r.memberId, r.status]))
    })
    Object.entries(contribMap).forEach(([evId, records]) => {
      indexedContribs[evId] = Object.fromEntries(records.map(r => [r.memberId, r.amount]))
    })
    return { indexedAttendance, indexedContribs }
  }, [attendanceMap, contribMap])

  const formatTableDate = (dateStr: string) => 
    dateStr ? new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""

  // --- EXPORT LOGIC ---
  const handleExportXLSX = async () => {
    const actMap = Object.fromEntries(availableActivities.map((a: any) => [a.id, a]))
    const evMap = Object.fromEntries(availableEvents.map((e: any) => [e.id, e]))
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(
      reportType === 'attendance' ? 'Attendance Report' : 
      reportType === 'contribution' ? 'Contribution Report' : 
      'Combined Report'
    )

    const headers = 
      reportType === 'attendance'
        ? [
            'Member Identity',
            ...selectedActivities.map(id => `${actMap[id]?.name || id} (${formatTableDate(actMap[id]?.date)})`),
            'Attendance %'
          ]
        : reportType === 'contribution'
        ? [
            'Member Identity',
            ...selectedEvents.map(id => `${evMap[id]?.name || id}\n(${evMap[id]?.type || ''})`),
            ...(selectedEvents.length > 1 ? ['Total Support'] : [])
          ]
        : [
            'Member Identity',
            ...selectedActivities.map(id => `${actMap[id]?.name || id} (${formatTableDate(actMap[id]?.date)})`),
            'Attendance %',
            ...selectedEvents.map(id => `${evMap[id]?.name || id}\n(${evMap[id]?.type || ''})`),
            ...(selectedEvents.length > 1 ? ['Total Support'] : [])
          ]

    sheet.addRow(headers)
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 30
    headerRow.eachCell(cell => {
      cell.fill = { 
        type: 'pattern', 
        pattern: 'solid', 
        fgColor: { argb: reportType === 'attendance' ? '1E40AF' : reportType === 'contribution' ? '047857' : 'A021F9' } 
      }
    })

    for (const m of filteredMembers) {
      const rowVals: any[] = [m.fullName]
      let attendancePerc = 0
      let totalMemberCash = 0
      
      if (reportType === 'attendance' || reportType === 'both') {
        for (const id of selectedActivities) {
          rowVals.push(memoizedIndexes.indexedAttendance[id]?.[m.id] || '—')
        }
        const presentCount = selectedActivities.filter(id => memoizedIndexes.indexedAttendance[id]?.[m.id]?.toLowerCase() === 'present').length
        attendancePerc = selectedActivities.length > 0 ? presentCount / selectedActivities.length : 0
        rowVals.push(attendancePerc)
      }

      if (reportType === 'contribution' || reportType === 'both') {
        for (const id of selectedEvents) {
          const amt = memoizedIndexes.indexedContribs[id]?.[m.id] || 0
          rowVals.push(amt)
          totalMemberCash += amt
        }
        // Add total only if more than 1 event
        if (selectedEvents.length > 1) {
          rowVals.push(totalMemberCash)
        }
      }

      const newRow = sheet.addRow(rowVals)

      // Style attendance cells (Present/Absent)
      if (reportType === 'attendance' || reportType === 'both') {
        const startCol = 2
        for (let i = 0; i < selectedActivities.length; i++) {
          const cell = newRow.getCell(startCol + i)
          const status = cell.value as string
          if (status?.toLowerCase() === 'present') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } }
            cell.font = { color: { argb: '065F46' }, bold: true }
          } else if (status?.toLowerCase() === 'absent') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }
            cell.font = { color: { argb: 'B91C1C' }, bold: true }
          }
        }
      }

      // Style attendance percentage and contribution cells
      if (reportType === 'attendance' || reportType === 'both') {
        const attColIndex = 1 + selectedActivities.length + 1
        const attCell = newRow.getCell(attColIndex)
        attCell.numFmt = '0%'
        if (selectedActivities.length > 0 && attendancePerc < (threshold / 100)) {
          attCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FECACA' } }
          attCell.font = { color: { argb: 'B91C1C' }, bold: true }
        }
      }

      if (reportType === 'contribution' || reportType === 'both') {
        const startCol = reportType === 'both' ? 2 + selectedActivities.length + 1 : 2
        
        // Style contribution amount cells - red if not contributed or insufficient
        for (let idx = 0; idx < selectedEvents.length; idx++) {
          const cell = newRow.getCell(startCol + idx)
          const eventId = selectedEvents[idx]
          const event = evMap[eventId]
          const amt = Number(cell.value) || 0
          const expectedAmount = event?.monthlyAmount || 0
          
          cell.numFmt = '#,##0'
          
          // Make red if didn't contribute enough
          if (amt === 0 || (expectedAmount > 0 && amt < expectedAmount)) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } }
            cell.font = { color: { argb: 'B91C1C' }, bold: true }
          }
        }
        
        // Style total column (only if more than 1 event)
        if (selectedEvents.length > 1) {
          const totalCol = startCol + selectedEvents.length
          newRow.getCell(totalCol).numFmt = '#,##0'
        }
      }
    }

    sheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }]
    sheet.columns.forEach(col => { col.width = 22 })
    const buf = await workbook.xlsx.writeBuffer()
    saveAs(
      new Blob([buf]), 
      `${reportType === 'attendance' ? 'Attendance' : reportType === 'contribution' ? 'Contribution' : 'Combined'}_Report_${isRangeMode ? selectedMonth + '_to_' + endDate : selectedMonth}.xlsx`
    )
  }

  return (
    <div className="flex h-screen w-full transition-colors overflow-hidden">
      
      {/* SIDEBAR: CRITERIA BUILDER */}
      <aside className="w-80 h-full border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b dark:border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white"><Settings2 size={16} /></div>
            <h1 className="text-[11px] font-black uppercase tracking-widest dark:text-slate-200">Report Engine</h1>
          </div>
          
          <div className="space-y-4">
            {/* Range Toggle */}
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Range Mode</span>
                <Checkbox checked={isRangeMode} onCheckedChange={(c) => setIsRangeMode(!!c)} />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">{isRangeMode ? 'From' : 'Month'}</label>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full p-2 border dark:border-slate-700 text-xs font-bold rounded-lg outline-none text-slate-900 dark:text-slate-100"/>
              </div>
              {isRangeMode && (
                <div className="space-y-1 animate-in slide-in-from-top-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">To</label>
                  <input type="month" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border dark:border-slate-700 text-xs font-bold rounded-lg outline-none text-slate-900 dark:text-slate-100"/>
                </div>
              )}
            </div>

            {/* Risk Slider */}
            <div className="space-y-2 border-t dark:border-slate-800 pt-3">
                <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-500 uppercase">Risk Threshold</span>
                    <span className="text-red-500 font-black">{threshold}%</span>
                  </div>
                  <input type="range" min="10" max="90" step="5" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-2 border dark:border-slate-700 text-xs rounded-lg outline-none"/>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section>
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase">Activities</p>
              <Button variant="ghost" className="h-4 text-[9px] px-1 text-emerald-600" onClick={() => setSelectedActivities(filteredActivities.map(a => a.id))}>Select All</Button>
            </div>
            {filteredActivities.map(act => (
              <label key={act.id} className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-md cursor-pointer transition-colors group">
                <Checkbox checked={selectedActivities.includes(act.id)} onCheckedChange={(c) => c ? setSelectedActivities([...selectedActivities, act.id]) : setSelectedActivities(selectedActivities.filter(i => i !== act.id))} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100">{act.name}</span>
              </label>
            ))}
          </section>
          
          <section>
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase">Contributions</p>
              <Button variant="ghost" className="h-4 text-[9px] px-1 text-emerald-600" onClick={() => setSelectedEvents(filteredEvents.map(e => e.id))}>Select All</Button>
            </div>
            {filteredEvents.map(ev => (
              <label key={ev.id} className="flex items-center gap-3 py-1.5 px-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-md cursor-pointer transition-colors group">
                <Checkbox checked={selectedEvents.includes(ev.id)} onCheckedChange={(c) => c ? setSelectedEvents([...selectedEvents, ev.id]) : setSelectedEvents(selectedEvents.filter(i => i !== ev.id))} />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100">{ev.name}</span>
              </label>
            ))}
          </section>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 min-w-0 flex flex-col h-full">
        <header className="h-16 border-b dark:border-slate-800 flex items-center justify-between px-8 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Grid View</h2>
            <div className="flex items-center gap-2 border-l dark:border-slate-700 pl-4">
              <button
                onClick={() => setReportType('attendance')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  reportType === 'attendance'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Attendance
              </button>
              <button
                onClick={() => setReportType('contribution')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  reportType === 'contribution'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Contribution
              </button>
              <button
                onClick={() => setReportType('both')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  reportType === 'both'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Both
              </button>
            </div>
            {isLoadingDetails && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
            <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600">{filteredMembers.length} Members Loaded</Badge>
          </div>
          <Button disabled={selectedActivities.length === 0 && selectedEvents.length === 0} onClick={handleExportXLSX} className="bg-slate-900 dark:bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg px-6 h-10 text-xs transition-all">
            <FileDown size={14} className="mr-2"/> GENERATE CUSTOM EXCEL
          </Button>
        </header>

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            <Table className="min-w-max border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-40 shadow-sm transition-colors">
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 z-50 bg-[#F8FAFC] dark:bg-slate-900 font-black text-slate-900 dark:text-slate-100 uppercase text-[10px] px-6 h-14 border-r border-b dark:border-slate-800">Member</TableHead>
                  {(reportType === 'attendance' || reportType === 'both') && filteredActivities.filter(a => selectedActivities.includes(a.id)).map(a => (
                    <TableHead key={a.id} className="text-center w-[120px] font-black text-[9px] uppercase border-r border-b dark:border-slate-800 px-2 transition-colors">
                      <span className="dark:text-slate-200">{a.name}</span><br/><span className="text-blue-500 font-bold">{formatTableDate(a.date)}</span>
                    </TableHead>
                  ))}
                  {(reportType === 'contribution' || reportType === 'both') && filteredEvents.filter(e => selectedEvents.includes(e.id)).map(e => (
                    <TableHead key={e.id} className="text-center w-[150px] font-black text-[9px] uppercase bg-emerald-50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-400 border-r border-b dark:border-slate-800 px-2 transition-colors">
                      {e.name}<br/><span className="text-emerald-500 opacity-70 font-bold">{e.type}</span>
                    </TableHead>
                  ))}
                  {reportType === 'attendance' && <TableHead className="text-center w-[140px] font-black text-blue-600 dark:text-blue-400 uppercase text-[9px] border-r border-b dark:border-slate-800 bg-blue-50/10 dark:bg-blue-900/5">Attendance %</TableHead>}
                  {reportType === 'contribution' && <TableHead className="text-center w-[150px] font-black text-slate-900 dark:text-slate-100 uppercase text-[9px] border-b dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900">Total Support</TableHead>}
                  {reportType === 'both' && <>
                    <TableHead className="text-center w-[140px] font-black text-blue-600 dark:text-blue-400 uppercase text-[9px] border-r border-b dark:border-slate-800 bg-blue-50/10 dark:bg-blue-900/5">Attendance %</TableHead>
                    <TableHead className="text-center w-[150px] font-black text-slate-900 dark:text-slate-100 uppercase text-[9px] border-b dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-900">Total Support</TableHead>
                  </>}
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {filteredMembers.map(m => {
                  const totalAct = selectedActivities.length;
                  const presentCount = selectedActivities.filter(id => memoizedIndexes.indexedAttendance[id]?.[m.id]?.toLowerCase() === 'present').length;
                  const attendancePerc = totalAct > 0 ? Math.round((presentCount / totalAct) * 100) : 0;
                  const totalMemberCash = selectedEvents.reduce((acc, id) => acc + (memoizedIndexes.indexedContribs[id]?.[m.id] || 0), 0);
                  
                  // LIVE RISK CALCULATION BASED ON USER SLIDER
                  const isHighRisk = totalAct > 0 && attendancePerc < threshold;
                  const hasZeroContribution = selectedEvents.length > 0 && totalMemberCash === 0;

                  return (
                    <TableRow key={m.id} className="hover:bg-slate-100/20 dark:hover:bg-slate-800/30 group transition-colors">
                      <TableCell className={`sticky left-0 group-hover:bg-slate-100/20 dark:group-hover:bg-slate-800/30 font-bold text-[11px] px-6 py-4 border-r border-b dark:border-slate-800 z-20 transition-colors ${isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        <div className="flex items-center gap-2">
                          {m.fullName}
                          {isHighRisk && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                      </TableCell>

                      {(reportType === 'attendance' || reportType === 'both') && filteredActivities.filter(a => selectedActivities.includes(a.id)).map(a => {
                        const status = memoizedIndexes.indexedAttendance[a.id]?.[m.id];
                        return (
                          <TableCell key={a.id} className="text-center border-r border-b dark:border-slate-800">
                            <div className="flex justify-center">
                              {!status ? <Minus size={14} className="text-slate-200 dark:text-slate-700" /> : status.toLowerCase() === 'present' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-400" />}
                            </div>
                          </TableCell>
                        );
                      })}

                      {(reportType === 'contribution' || reportType === 'both') && filteredEvents.filter(e => selectedEvents.includes(e.id)).map(e => {
                        const amount = memoizedIndexes.indexedContribs[e.id]?.[m.id] || 0;
                        return (
                          <TableCell key={e.id} className="text-center border-r border-b dark:border-slate-800">
                            <span className={`font-mono font-bold text-[10px] ${amount === 0 ? 'text-slate-300 dark:text-slate-700' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {amount > 0 ? amount.toLocaleString() : "0"}
                            </span>
                          </TableCell>
                        );
                      })}

                      {(reportType === 'attendance' || reportType === 'both') && <TableCell className={`border-r border-b dark:border-slate-800 px-4 ${isHighRisk ? 'bg-red-50/20 dark:bg-red-900/5' : 'bg-blue-50/10'}`}>
                        <div className="flex flex-col gap-1">
                          <span className={`text-[9px] font-black ${isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{attendancePerc}%</span>
                          <Progress value={attendancePerc} className={`h-1.5 ${isHighRisk ? 'bg-red-100 dark:bg-red-950' : 'bg-blue-100 dark:bg-blue-950'}`} style={{'--progress-foreground': isHighRisk ? '#ef4444' : '#3b82f6'} as any}/>
                        </div>
                      </TableCell>}

                      {(reportType === 'contribution' || reportType === 'both') && <TableCell className={`border-b dark:border-slate-800 text-center px-4 transition-colors ${hasZeroContribution ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}>
                        {hasZeroContribution ? (
                          <div className="flex items-center justify-center gap-1 text-slate-300 dark:text-slate-700 text-[9px] font-bold uppercase italic"><Wallet size={12} /><span>Missing Support</span></div>
                        ) : (
                          <span className="text-slate-900 dark:text-slate-100 bg-slate-100/50 dark:bg-slate-800/50 border dark:border-slate-700 px-3 py-1 rounded-full text-[10px] font-black shadow-sm transition-colors">
                            {totalMemberCash.toLocaleString()}
                          </span>
                        )}
                      </TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}