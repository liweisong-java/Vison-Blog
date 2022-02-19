package com.weisong.backend.exception;

import com.weisong.backend.util.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
//
//@Slf4j
//@RestControllerAdvice
//public class GlobalException {
//
//    @ExceptionHandler(MethodArgumentNotValidException.class)
//    public Result handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
//        log.error("参数校验异常：", e);
//        List<ObjectError> errors = e.getBindingResult().getAllErrors();
//        StringBuilder sb = new StringBuilder();
//        errors.stream().forEach(err -> sb.append(err.getDefaultMessage()).append(" | "));
//        return Result.fail(1, sb.toString());
//    }
//
//
//}
