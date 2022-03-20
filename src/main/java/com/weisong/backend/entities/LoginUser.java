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
public class LoginUser{
    /**
     * uuid
     */
    @TableId
    @Column(name="user_uuid")
    private String userUuid;

    /**
     * 头像
     */
    @Column(name="avatar")
    private String avatar;

    /**
     * 昵称
     */
    @NotEmpty(message = "名字不能为空")
    @Column(name="name")
    private String name;

    /**
     * 密码
     */
    @NotEmpty(message = "密码不能为空")
    @Column(name="password")
    private String password;

    /**
     * 电话
     */
    @Column(name="phone")
    private String phone;

    /**
     * 最近一次登录时间
     */
    @Column(name="last_time")
    private String lastTime;

    /**
     * 角色(1-超级管理员 2-普通用户 3-会员)
     */
    @Column(name="role_id")
    private Integer roleId;

    /**
     * 真实姓名
     */
    @Column(name="real_name")
    private String realName;

    /**
     * QQ
     */
    @Column(name="qq")
    private String qq;

    /**
     * 邮箱
     */
    @Column(name="email")
    private String email;

    /**
     * 性别
     */
    @Column(name="gender")
    private Integer gender;

    /**
     * 生日
     */
    @Column(name="birth")
    private String birth;

    /**
     * 简历
     */
    @Column(name="intro")
    private String intro;

    /**
     * 一句话介绍
     */
    @Column(name="one_sentence")
    private String oneSentence;

}
