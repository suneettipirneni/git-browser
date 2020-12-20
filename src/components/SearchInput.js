import '../style/search-input.scss'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { noop } from '../scripts/util'
import { AiOutlineSearch, AiOutlineLoading } from 'react-icons/ai'
import uniqueId from 'lodash/uniqueId'

const inputId = uniqueId('input-')

const SearchInput = props => {
  const [inputValue, setInputValue] = useState(props.value)
  const [hasError, setHasError] = useState(props.hasError)
  const [errorMessage, setErrorMessage] = useState(props.errorMessage)
  const [isLoading, setLoading] = useState(props.isLoading)

  const onSearch = () => {
    if (!isLoading) {
      props.onSearch(inputValue)
    }
  }

  const onChange = event => {
    const value = event.currentTarget.value.trim()
    setInputValue(value)
    props.onChange(value)
  }

  const onEnterPress = event => {
    if (
      event.repeat ||
      event.key !== 'Enter' ||
      document.activeElement.id !== inputId ||
      isLoading
    ) {
      return
    }

    onSearch()
  }

  useEffect(() => {
    document.addEventListener('keypress', onEnterPress)
    return () => {
      document.removeEventListener('keypress', onEnterPress)
    }
  }, [onEnterPress])

  // Re-render on changes in state
  useEffect(() => {
    setHasError(props.hasError)
    setErrorMessage(props.errorMessage)
  }, [props.hasError, props.errorMessage])

  useEffect(() => setLoading(props.isLoading), [props.isLoading])

  return (
    <div className={`search-input ${props.className}`}>
      <div className={`input-wrapper ${hasError ? 'input--error' : undefined}`}>
        <input
          type="text"
          id={inputId}
          onChange={onChange}
          placeholder={props.placeholder}
          value={props.value}
        />
        <button
          className="search-button"
          disabled={isLoading}
          onClick={onSearch}
        >
          {props.isLoading ? (
            <AiOutlineLoading className="loading-icon" />
          ) : (
            <AiOutlineSearch className="search-icon" />
          )}
        </button>
      </div>
      {hasError && (
        <label htmlFor={inputId} className="error-label">
          Error: {errorMessage}
        </label>
      )}
    </div>
  )
}

SearchInput.propTypes = {
  onSearch: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  hasError: PropTypes.bool,
  errorMessage: PropTypes.string,
  isLoading: PropTypes.bool
}

SearchInput.defaultProps = {
  onChange: noop,
  placeholder: '',
  hasError: false,
  errorMessage: '',
  isLoading: false,
  initialValue: ''
}

export default SearchInput
