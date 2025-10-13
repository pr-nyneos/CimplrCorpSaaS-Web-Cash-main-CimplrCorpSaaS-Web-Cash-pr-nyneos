// import React, { useState, useEffect } from "react";
// import {
//   flexRender,
//   getCoreRowModel,
//   getExpandedRowModel,
//   useReactTable,
//   createColumnHelper,
// } from "@tanstack/react-table";

// // Data Types
// type DocDetail = {
//   doc: string;
//   post: string;
//   due: string;
//   source: string;
//   adjustedSigned: number;
// };

// type GroupCompanyData = {
//   id: string;
//   groupCompanyCode: string;
//   currency: string;
//   docDetails?: DocDetail[];
// };

// type TableRow = GroupCompanyData | DocDetail;

// // Table Component
// function NyneOSTableExpanded({ data, columns, isExpanded = false, expandLevel = 1, getSubRows }) {
//   const [expanded, setExpanded] = useState({});

//   const table = useReactTable({
//     data,
//     columns,
//     state: {
//       expanded,
//     },
//     onExpandedChange: setExpanded,
//     getSubRows,
//     getCoreRowModel: getCoreRowModel(),
//     getExpandedRowModel: getExpandedRowModel(),
//   });

//   useEffect(() => {
//     if (isExpanded && expandLevel > 0) {
//       const expandAll = (rows, depth = 0) => {
//         if (depth >= expandLevel) return {};
        
//         return rows.reduce((acc, row) => {
//           if (row.getCanExpand()) {
//              acc[row.id] = true;
//           }
          
//           if (row.subRows?.length) {
//             Object.assign(acc, expandAll(row.subRows, depth + 1));
//           }
//           return acc;
//         }, {});
//       };
//       setExpanded(expandAll(table.getRowModel().rows));
//     }
//   }, [isExpanded, expandLevel, table.getRowModel().rows]);

//   return (
//     <div className="shadow-lg border border-gray-300">
//       <table className="w-full table-auto">
//         <thead className="bg-gray-200">
//           {table.getHeaderGroups().map((headerGroup) => (
//             <tr key={headerGroup.id}>
//               {headerGroup.headers.map((header) => (
//                 <th
//                   key={header.id}
//                   className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300"
//                   style={{ width: header.getSize() }}
//                 >
//                   {flexRender(
//                     header.column.columnDef.header,
//                     header.getContext()
//                   )}
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>

//         <tbody className="divide-y">
//           {table.getRowModel().rows.length === 0 ? (
//             <tr>
//               <td
//                 colSpan={columns.length}
//                 className="px-6 py-12 text-center text-gray-500"
//               >
//                 No Data
//               </td>
//             </tr>
//           ) : (
//             table.getRowModel().rows.map((row) => (
//               <tr
//                 key={row.id}
//                 className={
//                   row.depth === 0 
//                   ? "bg-gray-100 hover:bg-gray-200 transition-colors" 
//                   : "bg-white hover:bg-gray-50 transition-colors"
//                 }
//               >
//                 {row.getVisibleCells().map((cell) => (
//                   <td
//                     key={cell.id}
//                     className={`px-6 py-4 text-sm border-b border-gray-200 ${
//                       row.depth === 0 ? "font-bold text-gray-800" : "font-normal text-gray-600"
//                     }`}
//                   >
//                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                   </td>
//                 ))}
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// // Column Definitions
// const helper = createColumnHelper();

// const companyColumns = [
//   helper.display({
//     id: 'groupCompanyCode',
//     header: 'Company Code / Doc',
//     cell: ({ row }) => {
//       const isParent = row.depth === 0;
//       const original = row.original;

//       return (
//         <div style={{ 
//           paddingLeft: `${row.depth * 1.5}rem`, 
//           display: 'flex', 
//           alignItems: 'center',
//           gap: '0.5rem'
//         }}>
//           {isParent && row.getCanExpand() ? (
//             <button
//               onClick={row.getToggleExpandedHandler()}
//               style={{ cursor: 'pointer', fontSize: '1rem' }}
//             >
//               {row.getIsExpanded() ? '▼' : '►'}
//             </button>
//           ) : (
//             <span style={{ width: '1rem', display: 'inline-block' }}></span> 
//           )}

//           <span className={isParent ? "font-bold" : "font-normal"}>
//             {isParent ? original.groupCompanyCode : original.doc}
//           </span>
//         </div>
//       );
//     },
//   }),

//   helper.display({
//     id: 'currency_post',
//     header: 'Currency / Post',
//     cell: ({ row }) => {
//       if (row.depth === 0) {
//         return row.original.currency;
//       }
//       return row.original.post;
//     },
//   }),

//   helper.accessor((row) => row.due, {
//     id: 'due',
//     header: 'Due',
//     cell: ({ row }) => (row.depth > 0 ? row.original.due : ''),
//   }),

//   helper.accessor((row) => row.source, {
//     id: 'source',
//     header: 'Source',
//     cell: ({ row }) => (row.depth > 0 ? row.original.source : ''),
//   }),

//   helper.accessor((row) => row.adjustedSigned, {
//     id: 'adjustedSigned',
//     header: 'Adjusted (Signed)',
//     cell: ({ row }) => {
//         if (row.depth === 0) return '';
        
//         const amount = row.original.adjustedSigned;
//         const currency = row.getParentRow()?.original?.currency || 'USD';
        
//         return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
//     },
//   }),
// ];

// // Example Data
// const tableData = [
//   {
//     id: '1',
//     groupCompanyCode: 'NYN-EUR (Group A)',
//     currency: 'EUR',
//     docDetails: [
//       { doc: 'INV-1001', post: '2024-10-01', due: '2024-11-01', source: 'Purchase Invoice', adjustedSigned: 5000.00 },
//       { doc: 'GL-987', post: '2024-10-05', due: '2024-10-05', source: 'Journal Entry', adjustedSigned: -123.45 },
//     ],
//   },
//   {
//     id: '2',
//     groupCompanyCode: 'OST-USD (Group B)',
//     currency: 'USD',
//     docDetails: [
//       { doc: 'PAY-2005', post: '2024-09-15', due: '2024-09-30', source: 'Customer Payment', adjustedSigned: -1250.75 },
//       { doc: 'INV-2006', post: '2024-09-18', due: '2024-10-18', source: 'Sales Invoice', adjustedSigned: 2500.00 },
//     ],
//   },
//   {
//     id: '3',
//     groupCompanyCode: 'XYZ-GBP (No Docs)',
//     currency: 'GBP',
//     docDetails: [],
//   },
// ];

// const getSubRowsFn = (row) => {
//   return row.docDetails;
// };

// // Main Component
// export default function MyExpandedTableExample() {
//   return (
//     <div className="p-8 bg-gray-50 min-h-screen">
//       <h1 className="text-2xl font-bold mb-4 text-gray-800">Expandable Financial Documents Table</h1>
//       <p className="mb-6 text-gray-600">
//         This demo uses the <code className="bg-gray-200 px-2 py-1 rounded">NyneOSTableExpanded</code> component to show Group Company and Currency, 
//         with document details (Doc, Post, Due, Source, Adjusted) available upon clicking the expander arrow.
//       </p>
      
//       <div className="border border-gray-300 rounded overflow-hidden bg-white">
//         <NyneOSTableExpanded
//           data={tableData} 
//           columns={companyColumns}
//           getSubRows={getSubRowsFn}
//         />
//       </div>
      
//       <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
//         <h3 className="font-semibold text-blue-900 mb-2">💡 Try it out:</h3>
//         <ul className="text-blue-800 text-sm space-y-1">
//           <li>• Click the ► arrow to expand and see document details</li>
//           <li>• Click the ▼ arrow to collapse the details</li>
//           <li>• Notice how currencies format the amounts correctly</li>
//         </ul>
//       </div>
//     </div>
//   );
// }