const ChatForm = ({
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
  inputRef,
}) => {
  return (
    <form className='chatbot-form' onSubmit={onSubmit}>
      <input
        ref={inputRef}
        type='text'
        value={inputValue}
        onChange={onInputChange}
        placeholder='Ask something...'
        className='chatbot-message-input'
        disabled={isLoading}
        maxLength={500}
        required
      />

      <button
        type='submit'
        className='chatbot-send-btn'
        aria-label='Send message'
        disabled={isLoading}
      >
        <span className='chatbot-send-label' aria-hidden='true'>
          <svg
            className='chatbot-send-icon'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M9 6L15 12L9 18'
              stroke='currentColor'
              strokeWidth='2.8'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </span>
      </button>
    </form>
  );
};

export default ChatForm;
