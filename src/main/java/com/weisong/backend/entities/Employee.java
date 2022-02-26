package com.weisong.backend.entities;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sun.org.apache.xpath.internal.operations.Bool;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Table;
import javax.validation.constraints.*;
import java.util.Date;

/**
 * @author 李伟松
 * @create 2022-02-16-19:36
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name ="employee")
public class Employee {

    @Column(name="emp_Id")
    private Integer emp_Id;

    private String avatar;

    @NotEmpty(message = "名字不能为空")
    @Column(name="name")
    private String name;

    @NotEmpty(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Column(name="email")
    private String email;

    @NotNull(message = "性别不能为空")
    @Column(name="gender")
    private Integer gender;


    @Column(name="departmentName")
    private String departmentName;


    @Past(message = "只能用过去的时间")
    @Column(name="birth")
    private Date birth;

    @JsonIgnore
    @Column(name="enableEnum")
    private Integer enableEnum;


    private Boolean isEnable;
}
