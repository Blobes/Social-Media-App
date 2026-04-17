/\*export const usePostLike = <T extends LikablePost>(
post: T,
onLikeApi: (id: string, nextState: boolean) => Promise<any>,
context: UsePostLikeContext,
) => {
const {
getPendingLike,
setPendingLike,
clearPendingLike,
authStatus,
setModalContent,
isOffline,
isUnstableNetwork,
setSBMessage,
mode,
LoginPrompt: LoginStepper,
} = context;

const [postData, setPostData] = useState<T>(post);
const [isLiking, setIsLiking] = useState(false);

// LOGIC REFS
const clickGate = useRef(false); // UI Throttle: Prevents numerous clicking during server update
const stateVersion = useRef(0); // Version Tracking: Detects if UI state changed during API call

const { \_id } = postData;

// Sync localStorage on mount
useEffect(() => {
const pendingLike = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, \_id);
if (pendingLike !== null && pendingLike !== post.likedByMe) {
setPostData((prev) => ({
...prev,
likedByMe: pendingLike,
likeCount: prev.likeCount + (pendingLike ? 1 : -1),
}));
}
}, [_id, getPendingLike, post.likedByMe]);

const handleLike = useCallback(async () => {
if (clickGate.current) return;

    // GUARDS
    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return;
    }

    if (isOffline || isUnstableNetwork || mode === "OFFLINE") {
      setSBMessage({
        msg: {
          content:
            mode === "OFFLINE" ? "Post is offline." : "Connection unstable.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return;
    }

    const nextLiked = !postData.likedByMe;

    // --- STEP 1: INSTANT UI TOGGLE ---

    setIsLiking(true);

    setPostData((prev) => {
      setPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id, nextLiked);
      return {
        ...prev,
        likedByMe: nextLiked,
        likeCount: prev.likeCount + (nextLiked ? 1 : -1),
      };
    });

    if (nextLiked) vibrate();

    stateVersion.current += 1; // Increment version for every valid UI change
    const localVersion = stateVersion.current;

    try {
      clickGate.current = true; // Lock the UI

      // setTimeout(() => {
      //   clickGate.current = false;
      // }, 1000);

      const payload = await onLikeApi(_id, nextLiked);

      if (payload) {
        setPostData((prev) => {
          if (stateVersion.current !== localVersion) return prev;
          return {
            ...prev,
            likeCount: payload.likeCount,
            likedByMe: payload.likedByMe,
          };
        });
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
      }
    } catch (error) {
      setPostData((prev) => prev);
      clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
      console.error("Sync failed:", error);
    } finally {
      clickGate.current = false;
      setIsLiking(false);
    }

}, [
_id,
authStatus,
postData.likedByMe,
isOffline,
isUnstableNetwork,
mode,
onLikeApi,
setPendingLike,
clearPendingLike,
setSBMessage,
setModalContent,
LoginStepper,
]);

// Background sync effect...
useEffect(() => {
if (authStatus === "AUTHENTICATED") {
processQueue(authStatus, QUEUE_KEYS.POST.LIKE, onLikeApi);
const handleOnline = () =>
processQueue(authStatus, QUEUE_KEYS.POST.LIKE, onLikeApi);
window.addEventListener("online", handleOnline);
return () => window.removeEventListener("online", handleOnline);
}
}, [authStatus, onLikeApi]);

return { postData, isLiking, handleLike };
};\*/
