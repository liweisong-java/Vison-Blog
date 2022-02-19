package com.weisong.backend.util.enums;




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

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    ResultEnum(Integer status, String msg) {
        this.status = status;
        this.msg = msg;
    }

}
