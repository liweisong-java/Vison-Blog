package com.weisong.backend.util.Result;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @Description:
 * @Author: x
 * @Date :
 */
public enum ResultEnum {

    //成功

    SUCCESS(0,"成功"),
    //失败

    FAILED_FORMAT(1,"格式不正确");

    private Integer status;
    private String msg;

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    ResultEnum(Integer status, String msg) {
        this.status = status;
        this.msg = msg;
    }
}

