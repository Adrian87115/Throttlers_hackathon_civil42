import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormPage from "./FormPage";

function UpdatePage() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`http://localhost:8000/posts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        setInitialData(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchPost();
  }, [id]);

  if (!initialData) return <p>Loading post...</p>;

  return (
    <FormPage
      headerText="Edit Post"
      method="PUT"
      endpoint={`http://localhost:8000/posts/${id}/update`}
      initialTitle={initialData.title}
      initialContent={initialData.content}
      onSuccessRedirect={(post) => `/posts/${post.id}`}
    />
  );
}

export default UpdatePage;