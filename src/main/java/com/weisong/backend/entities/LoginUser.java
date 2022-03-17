package com.weisong.backend.entities;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.weisong.backend.util.UuidBuilderUtils;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotEmpty;

/**
 * @author 李伟松
 * @create 2022-03-06-14:11
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("user")
public class LoginUser {
    /**
     * 用户名
     */
    @NotEmpty(message = "名字不能为空")
    @Column(name="name")
    private String name;

    /**
     * 密码
     */
    @JsonIgnore
    @NotEmpty(message = "密码不能为空")
    @Column(name="password")
    private String password;

    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    @Column(name="email")
    private String email;
}
