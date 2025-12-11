export default function PendingReview() {
  return (
    <div className="h-screen flex items-center justify-center bg-yellow-100">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
        <p className="text-gray-700">
          Your organization account has been created and is awaiting approval.
          You’ll receive access shortly!
        </p>
      </div>
    </div>
  );
}
