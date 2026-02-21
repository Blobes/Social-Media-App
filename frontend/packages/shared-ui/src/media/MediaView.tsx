// export const MediaGallery = ({ mediaList, style }: MediaGalleryProps) => {
//     const theme = useTheme();

//     const displayData = useMemo(() => {
//         // Shuffle to decide visibility
//         const shuffled = [...mediaList].sort(() => Math.random() - 0.5);
//         const sliced = shuffled.slice(0, 6);

//         return sliced.map((item, index) => {
//             // Use real dimensions if available, otherwise fallback to index-based logic
//             const dimensions = getGridSpan(item.media.width || 100, item.media.height || 100, index);
//             return { ...item, ...dimensions };
//         });
//     }, [mediaList]);

//     const remainingCount = mediaList.length - 6;

//     return (
//         <ImageList
//             sx={{
//                 width: '100%',
//                 height: 'auto',
//                 borderRadius: theme.radius[2],
//                 overflow: 'hidden',
//                 margin: 0,
//                 // Ensure the list behaves as a flex/grid container properly
//                 display: 'grid',
//                 gap: '2px !important', // Tighten gaps between items
//                 ...style?.container?.base,
//             }}
//             variant="quilted"
//             cols={4}
//             rowHeight={150}
//         >
//             {displayData.map((item, index) => {
//                 const isLastItem = index === 5 && remainingCount > 0;
//                 const { id, media, onClick, cols, rows } = item;

//                 return (
//                     <ImageListItem
//                         key={id}
//                         cols={cols}
//                         rows={rows}
//                         sx={{
//                             position: 'relative',
//                             overflow: 'hidden',
//                             // IMPORTANT: Force the item to fill its assigned grid area
//                             '& .MuiImageListItem-imgWrapper': {
//                                 width: '100%',
//                                 height: '100%',
//                             }
//                         }}
//                     >
//                         <Box
//                             component={media.type === "video" ? "video" : "img"}
//                             src={media.src}
//                             // Video specific props
//                             {...(media.type === "video" && {
//                                 autoPlay: true,
//                                 loop: true,
//                                 muted: true,
//                                 playsInline: true
//                             })}
//                             // Image specific props
//                             {...(media.type !== "video" && {
//                                 loading: "lazy",
//                                 alt: media.title
//                             })}
//                             onClick={() => onClick && onClick(id)}
//                             sx={{
//                                 display: 'block', // Removes bottom whitespace
//                                 width: '100%',
//                                 height: '100%',
//                                 objectFit: 'cover', // Ensures the space is filled
//                                 cursor: 'pointer',
//                                 ...style?.content
//                             }}
//                         />

//                         {isLastItem && (
//                             <Box sx={{ /* ... your existing overlay styles ... */ }}>
//                                 <Typography variant="h4" color="white" fontWeight="bold">
//                                     +{remainingCount}
//                                 </Typography>
//                             </Box>
//                         )}
//                     </ImageListItem>
//                 );
//             })}
//         </ImageList>
//     );
// };