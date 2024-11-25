// Đối tượng Validator
function Validator(option) {
    function getParent(element, select) {
        while(element.parentElement) {
            if (element.parentElement.matches(select)) {
                return element.parentElement
            }   
            element = element.parentElement
        }
    }

    var selectorRules = {}

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, option.formGroupSelector).querySelector(option.errorSelector)
        var errorMessage

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector]

        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng việc kiểm tra 
        for (var i = 0; i< rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break
                default:
                    errorMessage = rules[i](inputElement.value)
            }
            if(errorMessage) break
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement, option.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, option.formGroupSelector).classList.remove('invalid')
        }

        return !errorMessage
    }

    // Lấy Element của validate
    var formElement = document.querySelector(option.form);
    if(formElement) {
        // Khi submit form
        formElement.onsubmit = function(e) {
            e.preventDefault()
            var isFormValid = true
            // Thực hiện lặp qua từng rules và validate
            option.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = validate(inputElement, rule)
                if(!isValid) {
                    isFormValid = false
                }
            })

            if(isFormValid) {
                // trường hợp submit với js
                if (typeof option.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]:not([disabled])') 
                    var formValues = Array.from(enableInputs).reduce(function(values, input) {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                break
                            case 'checkbox':
                                if (!input.matches(':checked')) return values
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = []
                                } 
                                values[input.name].push(input.value)
                                break
                            case 'file':
                                values[input.name] = input.files
                                break
                            default:
                                values[input.name] = input.value
                        }

                        return values;
                    }, {})
                    option.onSubmit(formValues)
                }
                // Trường hợp submit với hành vi mặc đinh/ html
                else {
                    formElement.submit()
                }
            }
        }
        // Xử lý lặp qua mỗi rule và xử lý (lắng nghe sự kiện blur, input,...)
        option.rules.forEach(function (rule) {
            // Lưu lại các Rule cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector)
            
            Array.from(inputElements).forEach(function(inputElement) {
                if(inputElement) {
                    // Xử lý trường hợp blur khỏi input
                    inputElement.onblur = function () {
                        validate(inputElement, rule)
                    }
    
                    // Xử lý mỗi khi người dùng nhập vào input
                    inputElement.oninput = function() {
                        var errorElement = getParent(inputElement, option.formGroupSelector).querySelector('.form-message')
                        errorElement.innerText = ''
                        getParent(inputElement, option.formGroupSelector).classList.remove('invalid')
                    }

                    // Xử lý khi người dùng thay đổi input thành giá trị sai
                    inputElement.onchange = function() {
                        var checkChangeOption = getParent(inputElement, option.formGroupSelector).querySelector(rule.selector).value
                        if (!checkChangeOption) {
                            validate(inputElement, rule)
                        } else {
                            var errorElement = getParent(inputElement, option.formGroupSelector).querySelector('.form-message')
                            errorElement.innerText = ''
                            getParent(inputElement, option.formGroupSelector).classList.remove('invalid')
                        }
                    }
                }
            })
        })
    }
}

// Định nghĩa các rules
// Đặt nguyên tắc của các rules
// 1. Khi có lỗi => trả ra message lỗi
// 2. Khi hợp lên => Không trả ra gì cả (undefined)
Validator.isRequired = function (selector) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function(selector) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Trường này phải là email'
        }
    }
}

Validator.minLength = function(selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiếu ${min} kí tự`;
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
        }
    }
}