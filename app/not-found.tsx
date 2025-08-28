export default function NotFound() {
  return (
    <div className="p-10 text-center space-y-4">
      <h1 className="text-3xl font-bold text-rose-600">Page Not Found</h1>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <a href="/" className="text-rose-600 underline">Return Home</a>
    </div>
  );
}
