import FormPage from "./FormPage";

function AddPage() {
  return (
    <FormPage
      headerText="Add a New Post"
      method="POST"
      endpoint="http://localhost:8000/posts/"
      onSuccessRedirect={(post) => `/posts/${post.id}`}
    />
  );
}

export default AddPage;