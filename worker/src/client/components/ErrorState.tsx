function ErrorState({ message = "データの取得に失敗しました" }) {
  return (
    <div role="alert" class="alert alert-error">
      <span>{message}</span>
      <button
        type="button"
        class="btn btn-sm"
        onClick={() => {
          location.reload();
        }}
      >
        再読み込み
      </button>
    </div>
  );
}

export default ErrorState;
